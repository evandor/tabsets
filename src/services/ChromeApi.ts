import {Tabset} from "src/models/Tabset";
import TabsetService from "src/services/TabsetService";
import {CLEANUP_PERIOD_IN_MINUTES} from "boot/constants";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import Navigation from "src/services/Navigation";

function runHousekeeping(alarm: chrome.alarms.Alarm) {
  if (alarm.name === "housekeeping") {
    TabsetService.housekeeping()
  }
}

class ChromeApi {

  init() {
    chrome.alarms.create("housekeeping", {periodInMinutes: CLEANUP_PERIOD_IN_MINUTES})

    chrome.alarms.onAlarm.addListener(
      (alarm: chrome.alarms.Alarm) => runHousekeeping(alarm)
    )

    chrome.management.getSelf(
      (self: chrome.management.ExtensionInfo) => {
        //console.log("self", self)
        localStorage.setItem("selfId", self.id)
      }
    )

    chrome.runtime.onUpdateAvailable.addListener(
      (details: any) => Navigation.updateAvailable(details)
    )

    this.buildContextMenu();

    chrome.contextMenus.onClicked.addListener(
      (e: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) => {
        //console.log("listening to", e, tab)
        if (e.menuItemId === "open_tabsets_page") {
          chrome.tabs.query({title: `Tabsets Extension`}, (result: chrome.tabs.Tab[]) => {
            if (result && result[0]) {
              chrome.tabs.highlight({tabs: result[0].index});
            } else {
              const selfId = localStorage.getItem("selfId")
              if (selfId) {
                chrome.tabs.create({
                  active: true,
                  pinned: false,
                  url: "chrome-extension://" + selfId + "/www/index.html#/start"
                })
              }
            }
          })
        } else if (e.menuItemId.startsWith("save_as_tab|")) {
          //console.log("got", e, e.menuItemId.split("|"))
          const tabId = tab?.id || 0
          const tabsetId = e.menuItemId.split("|")[1]
          console.log("got tabsetId", tabsetId, e.menuItemId)

          // @ts-ignore
          chrome.scripting.executeScript({
            target: {tabId: tab?.id, allFrames: true},
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
                });
              }
            }
          });
        }
      })
  }

  buildContextMenu() {
    const tabsStore = useTabsStore()
    chrome.contextMenus.removeAll(
      () => {
        chrome.contextMenus.create({id: 'tabset_extension', title: 'Tabset Extension', contexts: ['all']},
          () => {
            chrome.contextMenus.create({
              id: 'open_tabsets_page',
              parentId: 'tabset_extension',
              title: 'Open Tabsets Extension',
              contexts: ['all']
            })
            //console.log("building context menu from ", tabsStore.tabsets)
            _.forEach([...tabsStore.tabsets.values()], (ts: Tabset) => {
              console.log("new submenu from", ts.id)
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
  }

  async closeAllTabs() {
    console.log(" --- closing all tabs: start ---")
    const currentTab = await this.getCurrentTab()
    // @ts-ignore
    const t: chrome.tabs.Tab[] = await chrome.tabs.query({currentWindow: true})//, (t: chrome.tabs.Tab[]) => {
    console.log("checking tabs for closing", t)
    const ids: number[] = t.filter((r: chrome.tabs.Tab) => r.id !== currentTab.id)
      .filter(r => r.id !== undefined)
      .map(r => r.id || 0);
    console.log("ids to close", ids)
    if (ids.length > 0) {
      // @ts-ignore
      await chrome.tabs.remove(ids)
    }
    console.log(" --- closing all tabs: end ---")
  }

  restore(tabset: Tabset) {
    console.log("restoring tabset ", tabset.id)
    this.getCurrentTab()
      .then((currentTab: chrome.tabs.Tab) => {
        console.log("proceeding...")

        const promisedTabs: Promise<chrome.tabs.Tab>[] = []

        tabset.tabs.forEach(async t => {

          if (t.chromeTab.url !== currentTab.url) {
            //console.log("creating tab", t.chromeTab.id)
            const newTabPromise:Promise<chrome.tabs.Tab> = this.chromeTabsCreateAsync({
              active: false,
              index: t.chromeTab.index,
              pinned: t.chromeTab.pinned,
              url: t.chromeTab.url
            })
            //console.log("got new tab", newTabPromise)
            promisedTabs.push(newTabPromise)
          } else {
            console.log("omitting opening current tab again")
          }
        });

        Promise.all(promisedTabs)
          .then(() => useTabsStore().activateListeners())
      })
  }

  async getCurrentTab(): Promise<chrome.tabs.Tab> {
    if (process.env.MODE !== 'bex') {
      return Promise.reject("not in bex mode")
    }
    let queryOptions = {active: true, lastFocusedWindow: true};
    // @ts-ignore
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

  highlight(tabIndex: number | undefined) {
    if (tabIndex) {
      chrome.tabs.highlight({tabs: tabIndex})
    }
  }

  async tabsForUrl(url: string | undefined): Promise<chrome.tabs.Tab[]> {
    if (url) {
      // @ts-ignore
      return await chrome.tabs.query({url: url})
    }
    return Promise.reject("url not defined")
  }

  async childrenFor(bookmarkFolderId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    console.log("bookmarkFolderId", bookmarkFolderId)
    // @ts-ignore
    return await chrome.bookmarks.getChildren(bookmarkFolderId)
  }

  async getTab(tabId: number): Promise<chrome.tabs.Tab> {
    // @ts-ignore
    return await chrome.tabs.get(tabId)
  }

  createChromeTabObject(title: string, url: string, favIconUrl: string) {
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
      windowId: 0,
      incognito: false,
      selected: false
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
}

export default new ChromeApi();

