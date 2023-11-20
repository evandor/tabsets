import {Tabset} from "src/models/Tabset";
import {CLEANUP_PERIOD_IN_MINUTES, MONITORING_PERIOD_IN_MINUTES} from "boot/constants";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import NavigationService from "src/services/NavigationService";
import TabService from "src/services/TabService";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useSearchStore} from "src/stores/searchStore";
import {SearchDoc} from "src/models/SearchDoc";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {Tab} from "src/models/Tab";
import {uid} from "quasar";
import {FeatureIdent} from "src/models/AppFeature";
import {RequestInfo} from "src/models/RequestInfo";
import {useWindowsStore} from "stores/windowsStore";
import {MonitoringType} from "src/models/Monitor";
import {Router} from "vue-router";

function runHousekeeping() {
    //housekeeping()

    console.log("housekeeping now...")

    persistenceService.cleanUpTabsets()
    // clean up thumbnails
    persistenceService.cleanUpThumbnails()

    persistenceService.cleanUpRequests()

    persistenceService.cleanUpMetaLinks()

    persistenceService.cleanUpLinks()

    persistenceService.cleanUpContent()
        .then(searchDocs => {
            _.forEach(searchDocs, d => {
                //console.log("got document", d)
                useSearchStore().remove((doc: SearchDoc, idx: number) => {
                    if (doc.url === d.url) {
                        console.debug("removing", doc)
                    }
                    return doc.url === d.url
                })
                useSearchStore().addToIndex(
                    d.id, d.name, d.title, d.url, d.description, d.content, d.tabsets, d.favIconUrl
                )
            })
            //useSearchStore().addToIndex()
        })


    TabService.checkScheduled()
}


async function checkMonitors(router: Router) {
    const monitoredContentHash: string[] = []
    for (const ts of useTabsStore().tabsets.values()) {
        for (const tab of ts.tabs) {
            if (tab.monitor && tab.monitor.type === MonitoringType.CONTENT_HASH && tab.url) {
                monitoredContentHash.push(tab.url)
            }
        }
    }

    if (monitoredContentHash.length > 0) {
        //console.log("%croute", "color:orange", router, router.currentRoute.value.path)
        if (router.currentRoute.value.path.startsWith("/sidepanel")) {
            useWindowsStore().openThrottledInWindow(monitoredContentHash, {focused: false, state: "minimized"})
        } else {
            console.debug("not running openThrottledInWindow due to path not starting with /sidepanel", router.currentRoute.value.path)
        }
    }
}

const persistenceService = IndexedDbPersistenceService


class ChromeApi {

    onHeadersReceivedListener = function (details: any) {
        if (details.url) {
            persistenceService.saveRequest(details.url, new RequestInfo(details.statusCode as number, details.responseHeaders || []))
                .then(() => console.debug("added request"))
                .catch(err => console.warn("err", err))
        }
    }

    init(router: Router) {

        if (process.env.MODE !== 'bex') {
            return
        }

        console.debug("initializing ChromeApi")

        chrome.alarms.create("housekeeping", {periodInMinutes: CLEANUP_PERIOD_IN_MINUTES})
        chrome.alarms.create("monitoring", {periodInMinutes: MONITORING_PERIOD_IN_MINUTES})

        chrome.alarms.onAlarm.addListener(
            (alarm: chrome.alarms.Alarm) => {
                if (alarm.name === "housekeeping") {
                    runHousekeeping()
                } else if (alarm.name === "monitoring") {
                    if (usePermissionsStore().hasFeature(FeatureIdent.MONITORING)) {
                        checkMonitors(router)
                    }
                } else {
                    console.log("unknown alarm", alarm)
                }
            }
        )

        chrome.runtime.onUpdateAvailable.addListener(
            (details: any) => NavigationService.updateAvailable(details)
        )

        if (usePermissionsStore().hasAllOrigins() && usePermissionsStore().hasFeature(FeatureIdent.ANALYSE_TABS)) {
            this.startWebRequestListener()
        }
    }

    startWebRequestListener() {
        console.log("adding WebRequestListener")
        chrome.webRequest.onHeadersReceived.addListener(
            this.onHeadersReceivedListener,
            {urls: ['*://*/*'], types: ['main_frame']},
            ['responseHeaders']
        )
    }

    // TODO should be called somewhere, should it not?
    stopWebRequestListener() {
        console.log("removing WebRequestListener")
        chrome.webRequest.onHeadersReceived.removeListener(this.onHeadersReceivedListener)
    }

    buildContextMenu() {
        if (process.env.MODE !== 'bex') {
            return
        }
        console.log("building context menu")
        const tabsStore = useTabsStore()
        if (chrome && chrome.contextMenus) {
            chrome.contextMenus.removeAll(
                () => {
                    chrome.contextMenus.create({id: 'tabset_extension', title: 'Tabset Extension', contexts: ['all']},
                        () => {
                            // chrome.contextMenus.create({
                            //   id: 'open_tabsets_page',
                            //   parentId: 'tabset_extension',
                            //   title: 'Open Tabsets Extension',
                            //   contexts: ['all']
                            // })
                            //if (usePermissionsStore().hasFeature(FeatureIdent.ANALYSE_TABS)) {
                            chrome.contextMenus.create({
                                id: 'website_clip',
                                parentId: 'tabset_extension',
                                title: 'Create Website Clip',
                                contexts: ['all']
                            })
                            // chrome.contextMenus.create({
                            //   id: 'website_quote',
                            //   parentId: 'tabset_extension',
                            //   title: 'Create Website Quote',
                            //   contexts: ['all']
                            // })
                            //}
                            chrome.contextMenus.create({
                                id: 'save_to_currentTS',
                                parentId: 'tabset_extension',
                                title: 'Save to current Tabset',
                                contexts: ['all']
                            })
                            //console.log("building context menu from ", tabsStore.tabsets)
                            _.forEach([...tabsStore.tabsets.values()], (ts: Tabset) => {
                                //console.log("new submenu from", ts.id)
                                chrome.contextMenus.create({
                                    id: 'save_as_tab|' + ts.id,
                                    parentId: 'tabset_extension',
                                    title: 'Save to Tabset ' + ts.name,
                                    contexts: ['page']
                                })
                            })
                            //chrome.contextMenus.create({id: 'capture_text', parentId: 'tabset_extension', title: 'Save selection as/to Tabset', contexts: ['all']})

                        })
                }
            )
            chrome.contextMenus.onClicked.addListener(
                (e: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) => {
                    //console.log("listening to", e, tab)
                    if (e.menuItemId === "open_tabsets_page") {
                        chrome.tabs.query({title: `Tabsets Extension`}, (result: chrome.tabs.Tab[]) => {
                            if (result && result[0]) {
                                chrome.tabs.highlight({tabs: result[0].index});
                            } else {
                                // const selfId = localStorage.getItem("selfId")
                                // if (selfId) {
                                chrome.tabs.create({
                                    active: true,
                                    pinned: false,
                                    //url: "chrome-extension://" + selfId + "/www/index.html#/start"
                                    url: chrome.runtime.getURL("www/index.html#/start")
                                })
                                // }
                            }
                        })
                    } else if (e.menuItemId === "website_clip") {
                        console.log("creating Clip", tab)
                        if (tab && tab.id) {
                            this.executeClippingJS(tab.id)
                        }
                        // } else if (e.menuItemId === "website_quote") {
                        //   console.log("creating Quote", tab)
                        //   if (tab && tab.id) {
                        //     this.executeQuoteJS(tab.id)
                        //   }
                    } else if (e.menuItemId === 'save_to_currentTS') {
                        const tabId = tab?.id || 0
                        this.executeAddToTS(tabId, useTabsStore().currentTabsetId)
                    } else if (e.menuItemId.toString().startsWith("save_as_tab|")) {
                        //console.log("got", e, e.menuItemId.split("|"))
                        const tabId = tab?.id || 0
                        const tabsetId = e.menuItemId.toString().split("|")[1]
                        console.log("got tabsetId", tabsetId, e.menuItemId)
                        this.executeAddToTS(tabId, tabsetId)
                    }
                })
        }

    }


    async closeAllTabs() {
        console.log(" --- closing all tabs: start ---")
        const currentTab = await this.getCurrentTab()
        // @ts-ignore
        const t: chrome.tabs.Tab[] = await chrome.tabs.query({currentWindow: true})//, (t: chrome.tabs.Tab[]) => {
        const ids: number[] = t.filter((r: chrome.tabs.Tab) => r.id !== currentTab.id)
            .filter(r => r.id !== undefined)
            .map(r => r.id || 0);
        console.log("ids to close", ids)
        ids.forEach(id => {
            try {
                chrome.tabs.remove(id)
            } catch (err) {
                console.warn("got error removing tabs", err, ids)
            }
        })
        console.log(" --- closing all tabs: end ---")
    }

    restore(tabset: Tabset, windowName: string | undefined = undefined, inNewWindow: boolean = true) {
        console.log("restoring tabset ", tabset.id, windowName, inNewWindow)

        const urlAndGroupArray: object[] = _.map(tabset.tabs, (t: Tab) => {
            return {url: t.url, group: t.groupName} || {url: '', group: undefined}
        })
        console.log("restoring urls and groups:", urlAndGroupArray)
        if (inNewWindow && !windowName) {
            console.log("creating new window with urls", urlAndGroupArray)
            chrome.windows.create({
                focused: true,
                left: 50,
                top: 50,
                url: _.map(urlAndGroupArray, a => a['url' as keyof object])
            })
        } else if (windowName) { // open in named window
            useTabsStore().selectCurrentTabset(tabset.id)
            NavigationService.openOrCreateTab(
                _.map(urlAndGroupArray, a => a['url' as keyof object]),
                undefined,
                _.map(urlAndGroupArray, a => a['group' as keyof object]))
            // TODO deactivate listeners - needed?
            // useTabsStore().deactivateListeners()
            // this.getCurrentTab()
            //     ...
            //     Promise.all(promisedTabs)
            //       .then(() => useTabsStore().activateListeners())
            //   })
        } else {
            console.log("opening urls", urlAndGroupArray)
            NavigationService.openOrCreateTab(_.map(urlAndGroupArray, a => a['url' as keyof object]),
                undefined, _.map(urlAndGroupArray, a => a['group' as keyof object]))
        }
    }

    async getCurrentTab(): Promise<chrome.tabs.Tab> {
        if (process.env.MODE !== 'bex') {
            return Promise.reject("not in bex mode, but " + process.env.MODE)
        }

        return new Promise((resolve, reject) => {
            let queryOptions = {active: true, lastFocusedWindow: true};
            try {
                chrome.tabs.query(queryOptions, function (tabs) {
                    //console.log("got tab", tabs[0])
                    resolve(tabs[0]);
                })
            } catch (e) {
                reject(e);
            }
        })
    }

    highlight(tabIndex: number | undefined) {
        if (tabIndex) {
            chrome.tabs.highlight({tabs: tabIndex})
        }
    }

    async childrenFor(bookmarkFolderId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        console.log("bookmarkFolderId", bookmarkFolderId)
        // @ts-ignore
        return chrome.bookmarks.getChildren(bookmarkFolderId)
    }

    async getTab(tabId: number): Promise<chrome.tabs.Tab> {
        console.log("call to chromeapi get tab", tabId)
        // @ts-ignore
        return chrome.tabs.get(tabId)
    }

    createChromeTabObject(title: string, url: string, favIconUrl: string = "https://tabsets.web.app/icons/favicon-128x128.png") {
        return {
            active: false,
            discarded: true,
            // @ts-ignore
            groupId: -1,
            autoDiscardable: true,
            favIconUrl: favIconUrl,
            index: 0,
            highlighted: false,
            title: title,
            pinned: false,
            url: url,
            name: '',
            windowId: 0,
            incognito: false,
            selected: false
        }
    }

    createChromeBookmarkObject(title: string, url: string, favIconUrl: string) {
        return {
            id: uid(),
            active: false,
            discarded: true,
            // @ts-ignore
            groupId: -1,
            autoDiscardable: true,
            favIconUrl: favIconUrl,
            index: 0,
            highlighted: false,
            title: title,
            pinned: false,
            url: url,
            windowId: 0,
            incognito: false,
            selected: false
        }
    }

    createChromeTabGroupObject(id: number, title: string, color: chrome.tabGroups.ColorEnum) {
        return {
            id: id,
            title: title,
            color: color,
            collapsed: false,
            windowId: 1
        }
    }

    createChromeWindowObject(id: number, top: number, left: number) {
        return {
            id,
            alwaysOnTop: false,
            focused: true,
            incognito: false,
            height: 400,
            width: 600,
            top: top,
            left: left,
            state: 'normal' as chrome.windows.windowStateEnum,
            type: 'normal' as chrome.windows.windowTypeEnum
        }
    }

    private chromeTabsCreateAsync(createProperties: object): Promise<chrome.tabs.Tab> {
        return new Promise((resolve, reject) => {
            chrome.tabs.create(createProperties, tab => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError)
                } else {
                    resolve(tab);
                }
            });
        });
    }

    executeClippingJS(tabId: number) {
        // @ts-ignore
        chrome.scripting.insertCSS({
            target: {tabId: tabId},
            files: ['assets/content.css']
        }, () => {
            const lastError = chrome.runtime.lastError;
            if (lastError) {
                alert(JSON.stringify(lastError))
                return
            }
            // @ts-ignore
            chrome.scripting.executeScript({
                target: {tabId: tabId},
                files: ['clipping.js']
            });
        });
    }

    // executeQuoteJS(tabId: number) {
    //   // @ts-ignore
    //   chrome.scripting.executeScript({
    //     target: {tabId: tabId},
    //     files: ['quoting.js']
    //   });
    // }

    executeAddToTS(tabId: number, tabsetId: string) {
        // @ts-ignore
        chrome.scripting.executeScript({
            target: {tabId: tabId, allFrames: true},
            args: [tabId, tabsetId],
            func: (tabId: number, tabsetId: string) => {

                if (window.getSelection()?.anchorNode && window.getSelection()?.anchorNode !== null) {
                    const msg = {
                        msg: "addTabToTabset",
                        tabId: tabId,
                        tabsetId: tabsetId
                    }
                    console.log("sending message", msg)
                    chrome.runtime.sendMessage(msg, function (response) {
                        console.log("created new tab in current tabset:", response)
                        if (chrome.runtime.lastError) {
                            console.warn("got runtime error", chrome.runtime.lastError)
                        }
                    });
                }
            }
        });
    }
}

export default new ChromeApi();

