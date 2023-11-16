import {HTMLSelection} from "src/models/Tab";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {openURL} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {useWindowsStore} from "src/stores/windowsStore";
import JsUtils from "src/utils/JsUtils";
import {useGroupsStore} from "stores/groupsStore";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";

class NavigationService {

    placeholderPattern = /\${[^}]*}/gm

    async openOrCreateTab(
        withUrls: string[],
        matcher: string | undefined = undefined,
        groups: string[] = [],
        forceCurrent: boolean = false
    ) {
        withUrls.map(u => u.replace(this.placeholderPattern, ""));
        const useWindowIdent = forceCurrent ?
            'current' :
            useTabsStore().getCurrentTabset?.window || 'current'
        console.log(` > opening url ${withUrls} in window: '${useWindowIdent}', groups: '${groups}', mode: '${process.env.MODE}'`)

        const windowFromDb = await useWindowsStore().windowFor(useWindowIdent)
        const existingWindow = await useWindowsStore().currentWindowFor(useWindowIdent)

        if (useWindowIdent !== 'current') {
            //console.log("existingWindow", existingWindow)
            if (!existingWindow) {

                const createData: any = {url: withUrls}
                if (windowFromDb) {
                    const w = windowFromDb.browserWindow
                    createData['left' as keyof object] = (w.left || 0) < 0 ? 0 : w.left
                    createData['top' as keyof object] = (w.top || 0) < 0 ? 0 : w.top
                    createData['width' as keyof object] = (w.left || -1) < 0 ? 600 : w.width
                    createData['height' as keyof object] = (w.top || -1) < 0 ? 400 : w.height
                    // window does not exist anymore, remove from 'allWindows'
                    await useWindowsStore().removeWindow(windowFromDb.id)
                }

                // create a new window
                console.log("opening new window with", createData)
                chrome.windows.create(createData, (window) => {
                    //console.log("window", window)
                    if (window) {
                        useWindowsStore().assignWindow(useWindowIdent, window.id || 0)
                        //useWindowsStore().renameWindow(window.id || 0, useWindowIdent)
                        useWindowsStore().upsertWindow(window, useWindowIdent)
                        const ctx = this
                        withUrls.forEach(function (url, i) {
                            if (groups.length > i) {
                                const group = groups[i]
                                if (group && window.id && window.tabs && window.tabs.length > i) {
                                    console.log("assiging group", group, i)
                                    ctx.handleGroup(group, window.id, window.tabs[i]);
                                }
                            }
                        })

                    }
                })
                //useWindowsStore().r
                return
            }
        }

        if (process.env.MODE === "bex") {
            for (const url of withUrls) {
                // get all tabs with this url
                const tabsForUrl = useTabsStore().tabsForUrl(url) || []
                tabsForUrl.forEach(t => {
                    if (t.httpInfo) {
                        t.httpError = ''
                        t.httpInfo = ''

                        const ts = useTabsStore().tabsetFor(t.id)
                        if (ts) {
                            //console.log("saving tabset ", ts)
                            useTabsetService().saveTabset(ts)
                        }
                    }
                })
            }

            const useWindowId = existingWindow?.id || chrome.windows.WINDOW_ID_CURRENT
            const queryInfo = {windowId: useWindowId}
            console.log("using query info ", queryInfo)

            // getting all tabs from this window
            chrome.tabs.query(queryInfo, (t: chrome.tabs.Tab[]) => {
                const ctx = this
                withUrls.forEach(function (url, i) {
                    let found = false;
                    t.filter(r => r.url)
                        .map(r => {
                            let matchCondition = url === r.url
                            if (matcher && r.url) {
                                //console.log("matcher yielded", JsUtils.match(matcher, r.url))
                                matchCondition = JsUtils.match(matcher, r.url)
                            }
                            if (matchCondition) {
                                if (!found) { // highlight only first hit
                                    found = true
                                    console.log("found something", r)
                                    chrome.tabs.highlight({tabs: r.index, windowId: useWindowId});
                                    chrome.windows.update(useWindowId, {focused: true})

                                    if (groups.length > i) {
                                        ctx.handleGroup(groups[i], useWindowId, r);
                                    }
                                }
                            }
                        });
                    if (!found) {
                        console.log("tab not found, creating new one:", url)
                        chrome.tabs.create({
                            active: true,
                            pinned: false,
                            url: url,
                            windowId: useWindowId
                        }, (tab: chrome.tabs.Tab) => {
                            chrome.windows.update(useWindowId, {focused: true})

                            if (groups.length > i) {
                                ctx.handleGroup(groups[i], useWindowId, tab);
                            }
                        })

                    }
                })
            })
        } else {
            openURL(withUrls[0])
        }
    }

    private handleGroup(group: string | undefined, useWindowId: number, r: chrome.tabs.Tab) {
        if (group && usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS) && chrome?.tabs?.group) {
            console.log("handling current Group", group)
            const optionalGroup = useGroupsStore().currentGroupForName(group)
            if (!optionalGroup) {
                const props = {
                    createProperties: {
                        windowId: useWindowId
                    },
                    tabIds: [r.id || 0]
                }
                console.log("group not found, creating with", props)
                chrome.tabs.group(props, groupId => {
                    console.log("groupId", groupId)
                    const color = useGroupsStore().groupForName(group)?.color || 'grey'
                    chrome.tabGroups.update(groupId, {
                        collapsed: false,
                        color: color,
                        title: group
                    })
                })
            } else {
                const props = {
                    groupId: optionalGroup.id,
                    tabIds: [r.id || 0]
                }
                console.log("updating group with", props)

                chrome.tabs.group(props, c => console.log("c", c))
            }
        }
    }

    openTab(tabId: number) {
        return chrome.tabs.update(tabId, {active: true})
    }

    closeChromeTab(tab: chrome.tabs.Tab) {
        console.log("closing chrome tab", tab.id, tab?.id)
        try {
            chrome.tabs.remove(tab.id || 0)
        } catch (err) {
            console.log("error clsosing chrome tab", err)
        }
    }

    updateAvailable(details: any) {
        console.log("details: UpdateAvailableDetails", details)
        useNotificationsStore().updateAvailable(true, details.version)
    }

    backOneTab() {
        const [tabId, url] = useTabsStore().tabHistoryBack()
        this.openTab(tabId)
            .catch((err) => {
                useTabsStore().chromeTabsHistoryNavigating = false
                this.openOrCreateTab([url])
            })
    }

    forwardOneTab() {
        const [tabId, url] = useTabsStore().tabHistoryForward()
        this.openTab(tabId)
            .catch((err) => {
                useTabsStore().chromeTabsHistoryNavigating = false
                this.openOrCreateTab([url])
            })
    }
}

export default new NavigationService();

