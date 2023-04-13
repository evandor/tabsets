import {Tabset} from "src/models/Tabset";
import {CLEANUP_PERIOD_IN_MINUTES} from "boot/constants";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import NavigationService from "src/services/NavigationService";
import {RequestInfo} from "src/models/RequestInfo";
import StatsService from "src/services/StatsService";
import TabService from "src/services/TabService";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useSearchStore} from "src/stores/searchStore";
import {SearchDoc} from "src/models/SearchDoc";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {Tab} from "src/models/Tab";
import {uid} from "quasar";
import {FeatureIdent} from "src/models/AppFeature";

function runHousekeeping(alarm: chrome.alarms.Alarm) {
  if (alarm.name === "housekeeping") {
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
              console.log("removing", doc)
            }
            return doc.url === d.url
          })
          useSearchStore().addToIndex(
            d.id, d.name, d.title, d.url, d.description, d.content, d.tabsets, d.favIconUrl
          )
        })
        //useSearchStore().addToIndex()
      })


    StatsService.count()
    TabService.checkScheduled()
  }
}

const persistenceService = IndexedDbPersistenceService

class ChromeApi {

  onHeadersReceivedListener = function (details: any) {
    //console.log("headerDetails", details)
    if (details.url) {
      persistenceService.saveRequest(details.url, new RequestInfo(details.statusCode, details.responseHeaders || []))
        .then(() => console.debug("added request"))
        .catch(err => console.log("err", err))
    }
  }

  init() {

    if (process.env.MODE !== 'bex') {
      return
    }

    console.debug("initializing ChromeApi")

    chrome.alarms.create("housekeeping", {periodInMinutes: CLEANUP_PERIOD_IN_MINUTES})

    chrome.alarms.onAlarm.addListener(
      (alarm: chrome.alarms.Alarm) => runHousekeeping(alarm)
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

  stopWebRequestListener() {
    console.log("removing WebRequestListener")
    chrome.webRequest.onHeadersReceived.removeListener(this.onHeadersReceivedListener)
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
            console.log("building context menu from ", tabsStore.tabsets)
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
        console.log("listening to", e, tab)
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

  restore(tabset: Tabset, inNewWindow: boolean = true) {
    console.log("restoring tabset ", tabset.id, inNewWindow)

    if (inNewWindow) {
      const urls: string[] = _.map(_.filter(tabset.tabs, (t: Tab) => t.chromeTab !== undefined), (t: Tab) => t.chromeTab.url || '')

      chrome.windows.create({
        focused: true,
        left: 50,
        top: 50,
        url: urls
      })
    } else {
      this.getCurrentTab()
        .then((currentTab: chrome.tabs.Tab) => {
          console.log("proceeding...")

          const promisedTabs: Promise<chrome.tabs.Tab>[] = []

          tabset.tabs.forEach(async t => {

            if (t.chromeTab.url !== currentTab.url) {
              //console.log("creating tab", t.chromeTab.id)
              const newTabPromise: Promise<chrome.tabs.Tab> = this.chromeTabsCreateAsync({
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


  }

  async getCurrentTab(): Promise<chrome.tabs.Tab> {
    if (process.env.MODE !== 'bex') {
      return Promise.reject("not in bex mode, but " + process.env.MODE)
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
      return chrome.tabs.query({url: url});
    }
    return Promise.reject("url not defined")
  }

  async childrenFor(bookmarkFolderId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    console.log("bookmarkFolderId", bookmarkFolderId)
    // @ts-ignore
    return chrome.bookmarks.getChildren(bookmarkFolderId)
  }

  async getTab(tabId: number): Promise<chrome.tabs.Tab> {
    // @ts-ignore
    return chrome.tabs.get(tabId)
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

