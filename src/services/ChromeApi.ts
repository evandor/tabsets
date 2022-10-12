import {Tabset} from "src/models/Tabset";
import TabsetService from "src/services/TabsetService";
import {CLEANUP_PERIOD_IN_MINUTES} from "boot/constants";
// import getXPath from 'get-xpath'

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
      (self:chrome.management.ExtensionInfo) => {
        //console.log("self", self)
        localStorage.setItem("selfId", self.id)
      }
    )

    chrome.contextMenus.removeAll(
      () => {
        chrome.contextMenus.create({id: 'tabset_extension', title: 'Tabset Extension', contexts: ['all']},
          () => {
            chrome.contextMenus.create({id: 'open_tabsets_page', parentId: 'tabset_extension', title: 'Open Tabsets Extension', contexts: ['all']})
            chrome.contextMenus.create({id: 'capture_text', parentId: 'tabset_extension', title: 'Save as/to Tabset', contexts: ['all']})
          })
      }
    )

    chrome.contextMenus.onClicked.addListener(
      (e: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab | undefined) => {
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
        } else if (e.menuItemId === "capture_text") {
          console.log("executing script1", e)
          console.log("executing script2", tab)
          console.log("text", e.selectionText)
          console.log("tab", tab?.id)
          console.log("window", window.getSelection()?.anchorNode)
          const tabId = tab?.id || 0
          const selection = e.selectionText

          // @ts-ignore
          chrome.scripting.executeScript({
            target: {tabId: tab?.id, allFrames: true},
            args: [tabId, selection],
            func: (tabId: number, selection: string) => {
              //console.log("hier!!!!",window.getSelection())

              function getDomPath(el: Node ) {
                let stack = [];
                while ( el.parentNode != null ) {
                  let sibCount = 0;
                  let sibIndex = 0;
                  for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
                    var sib = el.parentNode.childNodes[i];
                    if ( sib.nodeName == el.nodeName ) {
                      if ( sib === el ) {
                        sibIndex = sibCount;
                      }
                      sibCount++;
                    }
                  }
                  if ( sibCount > 1 ) {
                    stack.unshift("/" + el.nodeName.toLowerCase() + '[' + sibIndex + ']');
                  } else {
                    stack.unshift('/' + el.nodeName.toLowerCase());
                  }
                  el = el.parentNode;
                }
                stack.pop()
                return stack.join("");
              }

              if (window.getSelection()?.anchorNode && window.getSelection()?.anchorNode !== null) {
                // @ts-ignore
                const xPath = getDomPath(window.getSelection().anchorNode)
                console.log("got xpath:",xPath)
                chrome.runtime.sendMessage({msg: "textCapture", tabId:tabId, xPath: xPath, selection: selection }, function(response) {
                  console.log("created xpath reference for tabsets:", response)
                });
              }
            }
          });
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
    console.log("bookmarkFolderId", bookmarkFolderId)
    // @ts-ignore
    return await chrome.bookmarks.getChildren(bookmarkFolderId)
  }

  async getTab(tabId: number):Promise<chrome.tabs.Tab> {
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
}

export default new ChromeApi();

