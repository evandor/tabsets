import {useTabsStore} from "src/stores/tabsStore";
import {LocalStorage, uid} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import _ from "lodash";
import {Tab} from "src/models/Tab";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useSearchStore} from "src/stores/searchStore";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useTabsetService} from "src/services/TabsetService2";

const {getTabset, getCurrentTabset, saveTabset, saveCurrentTabset, tabsetsFor, saveToTabset} = useTabsetService()

import {useDB} from "src/services/usePersistenceService";

const {db} = useDB()

class TabsetService {

  private localStorage: LocalStorage = null as unknown as LocalStorage

  setLocalStorage(localStorage: any) {
    this.localStorage = localStorage;
  }

  /**
   * Init, called when extension is loaded (via App.vue)
   */
  async init(doNotInitSearchIndex: boolean = false) {
    console.debug("initializing tabsetService")
    await db.loadTabsets()
    if (!doNotInitSearchIndex) {
      useSearchStore().populate(db.getContents())
    }
  }


  async restore(tabsetId: string, closeOldTabs: boolean = true) {
    console.log("restoring from tabset", tabsetId)
    const tabsStore = useTabsStore()
    try {
      tabsStore.deactivateListeners()
      if (closeOldTabs) {
        await ChromeApi.closeAllTabs()
      }
      const tabset = getTabset(tabsetId)
      if (tabset) {
        console.log("found tabset for id", tabsetId)
        ChromeApi.restore(tabset)
      }
    } catch (ex) {
      console.log("ex", ex)
    } finally {
      //tabsStore.activateListeners()
    }
  }


  async saveToCurrentTabset(tab: Tab, useIndex: number | undefined = undefined): Promise<number> {
    const currentTs = getCurrentTabset()
    if (currentTs) {
      return saveToTabset(currentTs, tab, useIndex)
    }
    return Promise.reject("could not get current tabset")
  }


  togglePin(tabId: number) {
    const currentTabset: Tabset = getCurrentTabset() || new Tabset("", "", [], [])
    _.filter(currentTabset.tabs, t => t.chromeTab.id === tabId)
      .forEach(t => {
        t.chromeTab.pinned = !t.chromeTab.pinned
        chrome.tabs.update(tabId, {pinned: t.chromeTab.pinned})
      })
  }

  isOpen(tabUrl: string): boolean {
    const tabsStore = useTabsStore()
    return _.filter(tabsStore.tabs, (t: chrome.tabs.Tab) => {
      return t?.url === tabUrl
    }).length > 0
  }

  saveAllPendingTabs(onlySelected: boolean = false): Promise<void> {
    const tabsStore = useTabsStore()
    const currentTabset = tabsStore.getCurrentTabset
    let successful = 0
    let failed = 0

    if (currentTabset) {
      _.forEach(
        tabsStore.pendingTabset.tabs,
        t => {
          if (t?.chromeTab?.id) {
            if (!onlySelected || (onlySelected && t.selected)) {
              //currentTabset.tabs.push(t)
              this.saveToCurrentTabset(t)
                .then(() => successful += 1)
                .catch(() => failed += 1)
            }
          } else {
            console.log("got tab with missing data", t)
          }
        })

      if (!onlySelected) {
        tabsStore.pendingTabset.tabs = []
      } else {
        _.remove(tabsStore.pendingTabset.tabs, {selected: true});
      }
      return saveTabset(currentTabset)
        .then(() => Promise.resolve())
    }
    return Promise.reject("no current tabset set")
  }

  saveSelectedPendingTabs() {
    this.saveAllPendingTabs(true)
  }

  removeSelectedPendingTabs() {
    const tabsStore = useTabsStore()
    tabsStore.pendingTabset.tabs = []
  }

  removeAllPendingTabs() {
    const tabsStore = useTabsStore()
    tabsStore.pendingTabset.tabs = []
  }

  setOnlySelectedTab(tab: Tab) {
    const currentTabset = getCurrentTabset()
    if (currentTabset) {
      _.forEach(currentTabset.tabs, (t: Tab) => {
        t.selected = t.id === tab.id;
      })
    }
  }


  async getThumbnailFor(selectedTab: Tab): Promise<any> {
    //console.log("checking thumbnail for", selectedTab.chromeTab.url)
    if (selectedTab.chromeTab.url) {
      return db.getThumbnail(selectedTab.chromeTab.url)
    }
    return Promise.reject("url not provided");
  }

  async getRequestFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.chromeTab.url) {
      return this.getRequestForUrl(selectedTab.chromeTab.url)
    }
    return Promise.reject("url not provided");
  }

  async getRequestForUrl(url: string): Promise<any> {
    return db.getRequest(url)
  }

  async getContentFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.chromeTab.url) {
      return this.getContentForUrl(selectedTab.chromeTab.url)
    }
    return Promise.reject("url not provided");
  }

  async getContentForUrl(url: string): Promise<any> {
    return db.getContent(url)
  }


  async getMetaLinksFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.chromeTab.url) {
      return this.getMetaLinksForUrl(selectedTab.chromeTab.url)
    }
    return Promise.reject("url not provided");
  }

  async getMetaLinksForUrl(url: string): Promise<any> {
    return db.getMetaLinks(url)
  }

  async getLinksFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.chromeTab.url) {
      return this.getLinksForUrl(selectedTab.chromeTab.url)
    }
    return Promise.reject("url not provided");
  }

  async getLinksForUrl(url: string): Promise<any> {
    return db.getLinks(url)
  }

  setCustomTitle(tab: Tab, title: string): Promise<any> {
    tab.name = title
    return saveCurrentTabset()
  }

  createPendingFromBrowserTabs() {
    //console.log(`createPendingFromBrowserTabs`)
    const tabsStore = useTabsStore()
    tabsStore.pendingTabset.tabs = []
    const urlSet = new Set<string>()
    _.forEach(tabsStore.tabs, t => {
      if (t.url) {
        if (!urlSet.has(t.url) && !t.url.startsWith("chrome")) {
          urlSet.add(t.url)
          tabsStore.pendingTabset.tabs.push(new Tab(uid(), t))
        }
      }
    })
  }

  getSelectedPendingTabs(): Tab[] {
    const tabsStore = useTabsStore()
    const ts = tabsStore.pendingTabset
    if (ts) {
      return _.filter(ts.tabs, t => t.selected)
    }
    return []
  }

  moveToTabset(tabId: string, toTabsetId: string): Promise<any> {
    const tabsStore = useTabsStore()

    const tabset = tabsStore.tabsetFor(tabId)
    if (tabset) {
      const tabIndex = _.findIndex(tabset.tabs, {id: tabId})
      const targetTabset = tabsStore.getTabset(toTabsetId)

      if (tabIndex >= 0 && targetTabset) {
        targetTabset.tabs.push(tabset.tabs[tabIndex])
        return saveTabset(targetTabset)
          .then(() => tabset.tabs.splice(tabIndex, 1))
          .then(() => saveTabset(tabset))
      } else {
        return Promise.reject("could not find tab/tabset " + tabId + "/" + toTabsetId)
      }
    }
    return Promise.reject("could not find tab " + tabId )
  }

  ignoreTab(tab: Tab) {
    const tabsStore = useTabsStore()
    tabsStore.ignoredTabset.tabs.push(tab)
    const ignoredTS: Tabset = tabsStore.ignoredTabset as Tabset
    saveTabset(ignoredTS)
  }

  exportData(exportAs: string, appVersion: string = "0.0.0"): Promise<any> {
    console.log("exporting as ", exportAs)

    const tabsStore = useTabsStore()
    let data = ''
    let filename = 'tabsets.' + appVersion + '.json'
    if (exportAs === 'json') {
      data = JSON.stringify([...tabsStore.tabsets.values()])
      return this.createFile(data, filename);
    } else if (exportAs === 'csv') {
      data = "not implemented yet"
      filename = "tabsets." + appVersion + ".csv"
      return this.createFile(data, filename);
    } else if (exportAs === 'bookmarks') {
      console.log("creating bookmarks...")

      chrome.bookmarks.getChildren("1", (results: chrome.bookmarks.BookmarkTreeNode[]) => {
        _.forEach(results, r => {
          if (r.title === "tabsetsBackup") {
            console.log("deleting folder", r.id)
            chrome.bookmarks.removeTree(r.id)
          }
        })
      })

      chrome.bookmarks.create({title: 'tabsetsBackup', parentId: '1'}, (result: chrome.bookmarks.BookmarkTreeNode) => {
        // console.log("res", result)
        _.forEach([...tabsStore.tabsets.values()], ts => {
          console.log("ts", ts)
          chrome.bookmarks.create({
            title: ts.name,
            parentId: result.id
          }, (folder: chrome.bookmarks.BookmarkTreeNode) => {
            _.forEach(ts.tabs, tab => {
              chrome.bookmarks.create({
                title: tab.name || tab.chromeTab.title,
                parentId: folder.id,
                url: tab.chromeTab.url
              })
            })
          })
        })
      })

      useBookmarksStore().loadBookmarks()
        .then(() => console.log("loaded in service"))

    }
    return Promise.resolve('done')
  }

  importData(json: string) {
    console.log("importing from json")
    const tabsStore = useTabsStore()
    let tabsets = JSON.parse(json)
    _.forEach(tabsets, tabset => {
      tabsStore.addTabset(tabset)
      saveTabset(tabset)

      _.forEach(tabset.tabs, tab => {
        //console.log("adding to index", tab)
        useSearchStore().addToIndex(
          tab.id,
          tab.chromeTab.title || '',
          tab.chromeTab.title || '',
          tab.chromeTab.url || '',
          '',
          '',
          [tabset.id],
          tab.chromeTab.favIconUrl || '')
      })
    })
  }

  createFile(data: string, filename: string) {
    const file = window.URL.createObjectURL(new Blob([data]));
    const docUrl = document.createElement('a');
    docUrl.href = file;
    docUrl.setAttribute('download', filename);
    document.body.appendChild(docUrl);
    docUrl.click();
    return Promise.resolve('done')
  }


  nameForTabsetId(tsId: string): string {
    return useTabsStore().tabsets.get(tsId)?.name || 'unknown'
  }

  async trackedTabsCount(): Promise<number> {
    // @ts-ignore
    const result: chrome.tabs.Tab[] = await chrome.tabs.query({})
    let trackedTabs = 0
    _.forEach(result, (tab: chrome.tabs.Tab) => {
      if (tab && tab.url && tabsetsFor(tab.url).length > 0) {
        trackedTabs++
      }
    })
    return trackedTabs
  }

  async closeTrackedTabs() {
    // TODO long-Running action
    const currentTab = await ChromeApi.getCurrentTab()
    chrome.tabs.query({}, (result: chrome.tabs.Tab[]) => {
      const tabsToClose: chrome.tabs.Tab[] = []
      _.forEach(result, (tab: chrome.tabs.Tab) => {
        if (tab && tab.url && tab.url !== currentTab.url && tabsetsFor(tab.url).length > 0) {
          tabsToClose.push(tab)
        }
      })
      // console.log("tabsToClose", tabsToClose)
      _.forEach(tabsToClose, (t: chrome.tabs.Tab) => {
        if (t.id) {
          chrome.tabs.remove(t.id)
        }
      })
    })
  }

  async closeAllTabs() {
    // TODO long-Running action
    ChromeApi.closeAllTabs()
  }

  /**
   * renames a tabset identified by its id with the new name. The old name
   * is returned.
   *
   * @param tabsetId
   * @param tabsetName
   */
  rename(tabsetId: string, tabsetName: string): Promise<string> {
    const trustedName = tabsetName.replace(STRIP_CHARS_IN_USER_INPUT, '')
    const tabset = getTabset(tabsetId)
    if (tabset) {
      const oldName = tabset.name
      tabset.name = trustedName
      return saveTabset(tabset)
        .then(() => Promise.resolve(oldName))
    }
    return Promise.reject("could not find tabset for id " + tabsetId)
  }

  canvasPosition(tabsetId: string, tabsetName: string) {
    const tabset = getTabset(tabsetId)
    if (tabset) {
      tabset.name = tabsetName
      saveTabset(tabset)
    }
  }

  moveTo(tabId: string, newIndex: number) {
    console.log("moving", tabId, newIndex)
    let tabs = useTabsStore().getCurrentTabs
    const oldIndex = _.findIndex(tabs, t => t.id === tabId)
    if (oldIndex >= 0) {
      const tab = tabs.splice(oldIndex, 1)[0];
      tabs.splice(newIndex, 0, tab);
      saveCurrentTabset()
    }
  }

  setView(tabsetId: string, view: string) {
    const tabset = useTabsStore().getTabset(tabsetId)
    if (tabset) {
      tabset.view = view
      saveTabset(tabset)
    }
  }

  toggleSorting(tabsetId: string) {
    const tabset = useTabsStore().getTabset(tabsetId)
    if (tabset) {
      switch (tabset.sorting) {
        case 'custom':
          tabset.sorting = 'alphabeticalUrl';
          break;
        case 'alphabeticalUrl':
          tabset.sorting = 'alphabeticalTitle';
          break;
        case 'alphabeticalTitle':
          tabset.sorting = 'custom';
          break;
        default:
          tabset.sorting = 'custom'
      }
      saveTabset(tabset)
    }
  }

  setPosition(tabId: string, top: number, left: number) {
    const tab = _.find(getCurrentTabset()?.tabs, t => t.id === tabId)
    if (tab) {
      tab.canvasLeft = left
      tab.canvasTop = top
      saveCurrentTabset()
        .catch((err) => console.error("problem saving tabset", err))
    } else {
      console.log("warning: could not set position for", tabId)
    }
  }

  saveCanvasLayer(tabsetId: string, layerInfo: string) {
    const tabset = getTabset(tabsetId)
    if (tabset) {
      tabset.canvas = layerInfo
      saveTabset(tabset)
    } else {
      console.log("warning: could not set save canvas for", tabsetId)
    }
  }

  saveNote(tabId: string, note: string, scheduledFor: Date | undefined): Promise<void> {
    // console.log("got", tabId, note)
    const tab = _.find(getCurrentTabset()?.tabs, (t: Tab) => t.id === tabId)
    if (tab) {
      tab.note = note
      if (scheduledFor) {
        tab.scheduledFor = scheduledFor.getTime()
      }
      return saveCurrentTabset()
    }
    return Promise.reject("did not find tab with id " + tabId)
  }

  markAsDeleted(tabsetId: string): Promise<boolean> {
    const ts = getTabset(tabsetId)
    if (ts) {
      ts.status = TabsetStatus.DELETED
      return saveTabset(ts)
        .then(() => {
          if (useTabsStore().currentTabsetId === tabsetId) {
            useTabsStore().currentTabsetId = null as unknown as string
          }
          return true
        })
    }
    return Promise.reject("could not mark as deleted: " + tabsetId)
  }

  markAs(tabsetId: string, status: TabsetStatus, type: TabsetType = TabsetType.DEFAULT): Promise<TabsetStatus> {
    console.debug(`marking ${tabsetId} as ${status}`)
    const ts = getTabset(tabsetId)
    if (ts) {
      const oldStatus = ts.status
      ts.status = status
      ts.type = type
      return saveTabset(ts)
        .then(() => oldStatus)
    }
    return Promise.reject("could not change status : " + tabsetId)
  }


}

export default new TabsetService();
