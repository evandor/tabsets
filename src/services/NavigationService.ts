import {HTMLSelection, Tab} from "src/models/Tab";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {openURL, useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {useWindowsStore} from "stores/windowsStores";

class NavigationService {

    async openOrCreateTab(withUrl: string) {
        const useWindow = useTabsStore().getCurrentTabset?.window || 'current'
        console.log("opening", withUrl, useWindow)

        const existingWindow = await useWindowsStore().windowFor(useWindow)
        if (useWindow !== 'current') {
            console.log("existingWindow", existingWindow)
            if (!existingWindow) {
                chrome.windows.create({url: withUrl}, (callback) => {
                    console.log("callback", callback)
                    if (callback) {
                        useWindowsStore().assignWindow(useWindow, callback)
                    }
                })
                return
            }
        }

        if (process.env.MODE === "bex") {
            // get all tabs with this url
            const tabsForUrl = useTabsStore().tabsForUrl(withUrl) || []
            const selections: HTMLSelection[] = []
            tabsForUrl.forEach(t => {
                if (t.selections) {
                    //console.log("found", t.selections)
                    t.selections.forEach(s => selections.push(s))
                    //selections.concat(t.selections)
                }
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
            const useWindowId = existingWindow?.id || chrome.windows.WINDOW_ID_CURRENT
            const queryInfo = {windowId: useWindowId}
            console.log("using query info ", queryInfo)
            chrome.tabs.query(queryInfo, (t: chrome.tabs.Tab[]) => {
                let found = false;
                t.filter(r => r.url)
                    .map(r => {
                        if (withUrl === r.url) {
                            if (!found) { // highlight only first hit
                                found = true
                                console.log("found something", r)
                                chrome.tabs.highlight({tabs: r.index, windowId: useWindowId});
                                chrome.windows.update(useWindowId, {focused: true})

                                console.log("sending Message highlightSelections")
                                chrome.runtime.sendMessage({
                                    msg: "highlightSelections",
                                    selections: selections
                                }, (res: any) => {
                                    //console.log("got response1", res)
                                })
                            }
                        }
                    });
                if (!found) {
                    console.log("tab not found, creating new one")
                    chrome.tabs.create({
                        active: true,
                        pinned: false,
                        url: withUrl,
                        windowId: useWindowId
                    }, (tab: chrome.tabs.Tab) => {
                        // pass selections and execute quoting script
                        if (selections.length > 0) {
                            console.log("selections", selections, tab.id)
                            // @ts-ignore
                            chrome.scripting.executeScript({
                                target: {tabId: tab.id || 0},
                                files: ['highlighting.js']
                            }, (result: any) => {
                                if (tab.id) {
                                    console.log("sending Message highlightSelections", tab.id)
                                    chrome.tabs.sendMessage(tab.id, {
                                        msg: "highlightSelections",
                                        selections: selections
                                    }, (res: any) => {
                                        //console.log("got response2", res)
                                    })
                                }
                            });
                        }

                    })
                }
            })
        } else {
            openURL(withUrl)//, undefined, {target: "_ts"}) - does not work
        }
    }

    openTab(tabId: number) {
        chrome.tabs.update(tabId, {active: true})
    }

    muteAll() {
        chrome.tabs.query({audible: true}, (tabs: chrome.tabs.Tab[]) => {
            tabs.forEach((t: chrome.tabs.Tab) => {
                if (t && t.id) {
                    chrome.tabs.update(t.id, {muted: true})
                }
            })
        })
    }


    closeChromeTab(tab: Tab) {
        console.log("closing chrome tab", tab.id, tab?.id)
        if (tab?.id) {
            try {
                chrome.tabs.remove(tab.chromeTabId || 0)
            } catch (err) {
                console.log("error clsosing chrome tab", err)
            }
        }
    }

    updateAvailable(details: any) {
        console.log("details: UpdateAvailableDetails", details)
        useNotificationsStore().updateAvailable(true, details.version)
    }
}

export default new NavigationService();

