import {Tabset} from "src/models/Tabset";
import TabsetService from "src/services/TabsetService";
import {CLEANUP_PERIOD_IN_MINUTES} from "boot/constants";

function runHousekeeping(alarm: chrome.alarms.Alarm) {
  //console.log("got alarm", alarm)
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
      (self:chrome.management.ExtensionInfo) => {
        //console.log("self", self)
        localStorage.setItem("selfId", self.id)
      }
    )

    chrome.contextMenus.removeAll(
      () => {
        chrome.contextMenus.create({id: 'open_tabsets_page', title: 'Open Tabsets Extension', contexts: ['all']})
      }
    )

    chrome.contextMenus.onClicked.addListener(
      (e: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) => {
        //console.log("e", e, tab)
        if (e.menuItemId === "open_tabsets_page") {
          chrome.tabs.query({title: `Tabsets Extension ${import.meta.env.PACKAGE_VERSION}`}, (result: chrome.tabs.Tab[]) => {
            if (result && result[0]) {
              chrome.tabs.highlight({tabs: result[0].index});
            } else {
              const selfId = localStorage.getItem("selfId")
              if (selfId) {
                chrome.tabs.create({
                  active: true,
                  pinned: false,
                  url: "chrome-extension://"+selfId+"/www/index.html#/start"
                })
              }
            }
          })
        }
      })
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

  getTabs() {
    return [];
  }

  async restore(tabset: Tabset) {
    console.log("restoring tabset ", tabset.id)
    const currentTab = await this.getCurrentTab()
    //await this.closeAllTabs()
    //console.log("proceeding...")

    await tabset.tabs.forEach(async t => {
      if (t.chromeTab.url !== currentTab.url) {
        console.log("creating tab", t.chromeTab.id)
        await chrome.tabs.create({
          active: false,
          index: t.chromeTab.index,
          pinned: t.chromeTab.pinned,
          url: t.chromeTab.url
        })
      } else {
        console.log("omitting opening current tab again")
      }
    });
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
    // @ts-ignore
    return await chrome.bookmarks.getChildren(bookmarkFolderId)
  }

  createChromeTabObject(title: string, url: string) {
    return {
      active: false,
      discarded: true,
      // @ts-ignore
      groupId: -1,
      autoDiscardable: true,
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
}

export default new ChromeApi();

