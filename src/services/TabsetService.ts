import {useTabsStore} from "src/stores/tabsStore";
import {LocalStorage, uid} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import _ from "lodash";
import {Tab, TabStatus} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useAuthStore} from "src/stores/auth";
import {AxiosResponse} from "axios";
import {SyncMode} from "src/models/Subscription";
import {useSearchStore} from "src/stores/searchStore";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService"

class TabsetService {

  private persistenceService = IndexedDbPersistenceService

  private localStorage: LocalStorage = null as unknown as LocalStorage

  setLocalStorage(localStorage: any) {
    this.localStorage = localStorage;
  }

  /**
   * Init, called when extension is loaded (via App.vue)
   */
  async init() {
    await this.persistenceService.init();
    useSearchStore().populate(this.persistenceService.getContents())
    await this.persistenceService.loadTabsets()
  }

  /**
   * Will create a new tabset (or update an existing one with matching name) from
   * the provided Chrome tabs.
   *
   * The tabset is created or updated in the store, and the new data is persisted.
   *
   * @param name the tabset's name (TODO: validation)
   * @param chromeTabs an array of Chrome tabs.
   * @param merge if true, the old values and the new ones will be merged.
   */
  async saveOrReplaceFromChromeTabs(name: string, chromeTabs: chrome.tabs.Tab[], merge: boolean = false): Promise<object> {
    const tabsStore = useTabsStore()
    const tabs = _.map(chromeTabs, t => new Tab(uid(), t))
    const result = await tabsStore.updateOrCreateTabset(name, tabs, merge)
    if (result && result.tabset) {
      await this.saveTabset(result.tabset)
      this.selectTabset(result.tabset.id)
    }
    return {
      replaced: result.replaced,
      merged: merge
    }
  }

  /**
   * Will create a new tabset (or update an existing one with matching name) from
   * the provided bookmarks.
   *
   * The tabset is created or updated in the store, and the new data is persisted.
   *
   * @param name the tabset's name (TODO: validation)
   * @param bms an array of Chrome bookmarks.
   * @param merge if true, the old values and the new ones will be merged.
   */
  async saveOrReplaceFromBookmarks(name: string, bms: chrome.bookmarks.BookmarkTreeNode[], merge: boolean = false): Promise<object> {
    const tabsStore = useTabsStore()
    const tabs = _.map(bms, c => {
      const tab = new Tab(uid(), null as unknown as chrome.tabs.Tab)
      tab.bookmarkUrl = c.url
      tab.bookmarkId = c.id
      tab.created = c.dateAdded || 0
      tab.chromeTab = ChromeApi.createChromeTabObject(c.title || '', c.url || '', '')
      return tab
    })
    const result = await tabsStore.updateOrCreateTabset(name, tabs, merge)
    if (result && result.tabset) {
      await this.saveTabset(result.tabset)
      this.selectTabset(result.tabset.id)
    }
    return {
      replaced: result.replaced,
      merged: merge
    }
  }

  async saveTabset(tabset: Tabset) {
    if (tabset.id) {
      // if (useAuthStore().isAuthenticated && useAuthStore().subscription.syncMode === SyncMode.ACTIVE) {
      //   console.log("saving tabset to firebase")
      //   backendApi.saveTabset(tabset)
      // } else {
        await this.persistenceService.saveTabset(tabset)
      //}
      return
    }
  }

  saveCurrentTabset() {
    const tabsStore = useTabsStore()
    const currentTabset = tabsStore.getCurrentTabset
    if (currentTabset) {
      this.saveTabset(currentTabset)
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
      const tabset = this.getTabset(tabsetId)
      if (tabset) {
        console.log("found tabset for id", tabsetId)
        ChromeApi.restore(tabset)
        // .then((res: any) => {
        //   console.log("res", res)
        //   tabsStore.activateListeners()
        // })
      }
    } catch (ex) {
      console.log("ex", ex)
    } finally {
      //tabsStore.activateListeners()
    }
  }

  delete(tabsetId: string) {
    console.log("deleting tabset ", tabsetId)
    const tabset = this.getTabset(tabsetId)
    if (tabset) {
      const tabsStore = useTabsStore()
      _.forEach(tabsStore.getTabset(tabsetId)?.tabs, t => this.removeThumbnailsFor(t.chromeTab.url || ''))
      tabsStore.deleteTabset(tabsetId)
      this.persistenceService.deleteTabset(tabsetId)
      //this.db.delete('tabsets', tabsetId)
      const nextKey: string = tabsStore.tabsets.keys().next().value
      console.log("setting next key to", nextKey)
      this.selectTabset(nextKey)
    }
  }

  private getTabset(tabsetId: string): Tabset | undefined {
    //return this.localStorage.getItem<Tabset>("tabsets.tabset." + tabsetId);
    const tabsStore = useTabsStore()
    return _.find([...tabsStore.tabsets.values()], ts => ts.id === tabsetId)
  }

  getCurrentTabset(): Tabset | undefined {
    const tabsStore = useTabsStore()
    return tabsStore.tabsets.get(tabsStore.currentTabsetId)
  }

  setStatus(tabId: number, status: TabStatus) {
    const currentTabset: Tabset = this.getCurrentTabset() || new Tabset("", "", [], [])
    _.forEach(
      _.filter(currentTabset.tabs, (t: Tab) => t.chromeTab.id === tabId),
      r => r.status = status)
    this.saveTabset(currentTabset)
  }

  async saveToCurrentTabset(tab: Tab): Promise<number> {
    return this.saveToTabset(this.getCurrentTabset() || new Tabset(uid(), "unknown", [], []), tab)
  }

  async saveToTabsetId(tsId: string, tab: Tab): Promise<number> {
    const ts = this.getTabset(tsId)
    if (ts) {
      return this.saveToTabset(ts, tab)
    }
    return Promise.reject("no tabset for give id " + tsId)
  }

  async saveToTabset(ts: Tabset, tab: Tab): Promise<number> {
    //console.log("saving to tabset", ts, tab)
    if (tab.chromeTab.url) {
      const tabsStore = useTabsStore()

      const indexInTabset = _.findIndex(ts.tabs, t => t.chromeTab.url === tab.chromeTab.url)
      if (indexInTabset >= 0) {
        return Promise.reject("tab exists already")
      }

      tab.status = TabStatus.DEFAULT
      ts.tabs.push(tab)

      const index = _.findIndex(tabsStore.pendingTabset.tabs, t => t.id === tab.id)
      tabsStore.pendingTabset.tabs.splice(index, 1);
      this.saveTabset(ts)

      const encodedUrl = btoa(tab.chromeTab.url)
      let content = ''
      let description = ''

      this.persistenceService.updateContent(tab.chromeTab.url)

      this.persistenceService.updateThumbnail(tab.chromeTab.url)

      // update fuse index
      return useSearchStore().addToIndex(
        tab.id,
        tab.chromeTab.title || '',
        tab.chromeTab.title || '',
        tab.chromeTab.url || '',
        description,
        content,
        [ts.id],
        tab.chromeTab.favIconUrl || '')
    }
    return Promise.reject("tab.chromeTab.url undefined")
  }

  togglePin(tabId: number) {
    const currentTabset: Tabset = this.getCurrentTabset() || new Tabset("", "", [], [])
    _.filter(currentTabset.tabs, t => t.chromeTab.id === tabId)
      .forEach(t => {
        t.chromeTab.pinned = !t.chromeTab.pinned
        chrome.tabs.update(tabId, {pinned: t.chromeTab.pinned})
      })
  }

  isOpen(tabUrl: string): boolean {
    const tabsStore = useTabsStore()
    //console.log("checking tabUrl", tabUrl)
    return _.filter(tabsStore.tabs, t => {
      return t?.url === tabUrl
    }).length > 0
  }

  selectTabset(tabsetId: string): void {
    console.log("selecting tabset", tabsetId)
    const tabsStore = useTabsStore()
    this.resetSelectedTabs()
    tabsStore.currentTabsetId = tabsetId;
    const auth = useAuthStore()
    if (auth.isAuthenticated && auth.user) {
      localStorage.setItem(auth.user['uid'] + ".selectedTabset", tabsetId)
    } else {
      localStorage.setItem("selectedTabset", tabsetId)
    }
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
                .catch((err: any) => failed += 1)
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
      return this.saveTabset(currentTabset)
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
    const currentTabset = this.getCurrentTabset()
    if (currentTabset) {
      _.forEach(currentTabset.tabs, (t: Tab) => {
        t.selected = t.id === tab.id;
      })
    }
  }

  resetSelectedTabs() {
    const currentTabset = this.getCurrentTabset()
    if (currentTabset) {
      _.forEach(currentTabset.tabs, (t: Tab) => t.selected = false)
    }
    useNotificationsStore().setSelectedTab(null as unknown as Tab)
  }

  saveThumbnailFor(tab: chrome.tabs.Tab | undefined, thumbnail: string) {
    if (tab && tab.url) {
      const encodedTabUrl = btoa(tab.url)
      //localStorage.setItem("tabsets.tab.xxx", thumbnail)
      this.persistenceService.saveThumbnail(tab.url, thumbnail)
        .then(ts => console.log("added thumbnail"))
        .catch(err => console.log("err", err))
    }
  }

  async getThumbnailFor(selectedTab: Tab): Promise<any> {
    //console.log("checking thumbnail for", selectedTab.chromeTab.url)
    if (selectedTab.chromeTab.url) {
      return await this.persistenceService.getThumbnail(selectedTab.chromeTab.url)

    }
    return Promise.reject("url not provided");
  }

  async getContentFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.chromeTab.url) {
      return this.persistenceService.getContent(selectedTab.chromeTab.url)
    }
    return Promise.reject("url not provided");
  }

  removeThumbnailsFor(url: string): Promise<any> {
    return this.persistenceService.deleteThumbnail(url)
  }

  removeContentFor(url: string): Promise<any> {
    return this.persistenceService.deleteContent(url)

  }

  saveText(tab: chrome.tabs.Tab | undefined, text: string, metas: object) {
    if (tab && tab.url) {
      const encodedTabUrl = btoa(tab.url)
      const title = tab.title || ''
      const url = tab.url
      //let searchIndexId: number | undefined = undefined
      const tabsetIds: string[] = this.tabsetsFor(tab.url)

      this.persistenceService.saveContent(tab, text, metas, title, tabsetIds)
        .then(ts => console.log("added content"))
        .catch(err => console.log("err", err))

    }
  }

  setCustomTitle(tab: Tab, title: string) {
    tab.name = title
    this.saveCurrentTabset()
  }

  createPendingFromBrowserTabs() {
    console.log(`createPendingFromBrowserTabs`)
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

  moveToTabset(tabId: string, tabsetId: string) {
    const tabsStore = useTabsStore()
    const tabIndex = _.findIndex(tabsStore.getCurrentTabs, {id: tabId})
    const targetTabset = tabsStore.getTabset(tabsetId)
    if (tabIndex >= 0 && targetTabset) {
      console.log("found tabIndex", tabIndex)
      console.log("found targetTabset", targetTabset)
      targetTabset.tabs.push(tabsStore.getCurrentTabs[tabIndex])
      tabsStore.getCurrentTabs.splice(tabIndex, 1)
    } else {
      console.error("could not find tab/tabset", tabId, tabsetId)
    }
  }

  ignoreTab(tab: Tab) {
    const tabsStore = useTabsStore()
    tabsStore.ignoredTabset.tabs.push(tab)
    const ignoredTS: Tabset = tabsStore.ignoredTabset as Tabset
    this.saveTabset(ignoredTS)
  }

  // deprecated
  // syncTabset(tabsetId: string): Promise<AxiosResponse<string>> {
  //   const tabsStore = useTabsStore()
  //   const ts = tabsStore.getTabset(tabsetId)
  //   if (ts) {
  //     return backendApi.saveTabset(ts)
  //       .then(res => {
  //         this.delete(ts.id)
  //         this.loadTabsetsFromFirebase()
  //         console.log("got backend answer: ", res)
  //         return res
  //       })
  //   }
  //   return Promise.reject("tabset '" + tabsetId + "' not found")
  //
  // }

  // deprecated
  // unsyncTabset(tabsetId: string): Promise<AxiosResponse<string>> {
  //   const tabsStore = useTabsStore()
  //   const ts = tabsStore.getTabset(tabsetId)
  //   if (ts) {
  //     this.saveTabset(ts)
  //     // const backend = initializeBackendApi(process.env.BACKEND_URL || "unknown", null)
  //
  //     //const clonedTs = JSON.parse(JSON.stringify(ts))
  //     // console.log("cloned ts", ts, clonedTs)
  //     return backendApi.deleteTabset(tabsetId)
  //       .then(res => {
  //         //this.delete(ts.id)
  //         this.loadTabsetsFromFirebase()
  //         console.log("got backend answer: ", res)
  //         return res
  //       })
  //   }
  //   return Promise.reject("tabset '" + tabsetId + "' not found")
  //
  // }

  // loadTabsetsFromFirebase() {
  //   //const firebaseEnabled = useFeatureTogglesStore().firebaseEnabled
  //   const authenticated = useAuthStore().isAuthenticated
  //   if (authenticated) {
  //     backendApi.getTabsets()
  //       .then(ts => {
  //         console.log("tabsets from firebase", ts.data)
  //
  //         _.forEach(ts.data, (ts: Tabset) => {
  //           console.log("got tabset", ts)
  //           useTabsStore().addTabset(ts)
  //         })
  //       })
  //       .catch(err => console.log("error", err))
  //   }
  // }

  exportData(exportAs: string): Promise<any> {
    console.log("exporting as ", exportAs)

    const tabsStore = useTabsStore()
    let data = ''
    let filename = 'tabsets.json'
    if (exportAs === 'json') {
      data = JSON.stringify([...tabsStore.tabsets.values()])
      return this.createFile(data, filename);
    } else if (exportAs === 'csv') {
      data = "not implemented yet"
      filename = "tabsets.csv"
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
        console.log("res", result)
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
      this.saveTabset(tabset)
    })
  }

  private createFile(data: string, filename: string) {
    var file = window.URL.createObjectURL(new Blob([data]));
    var docUrl = document.createElement('a');
    docUrl.href = file;
    docUrl.setAttribute('download', filename);
    document.body.appendChild(docUrl);
    docUrl.click();
    return Promise.resolve('done')
  }

  async housekeeping() {
    // clean up thumbnails
    this.persistenceService.cleanUpThumbnails()

    this.persistenceService.cleanUpContent()
  }

  urlExistsInATabset(url: string): boolean {
    //console.log("checking url", url)
    for (let ts of [...useTabsStore().tabsets.values()]) {
      if (_.find(ts.tabs, t => t.chromeTab.url === url)) {
        return true;
      }
    }
    return false;
  }

  tabsetsFor(url: string): string[] {
    const tabsets: string[] = []
    for (let ts of [...useTabsStore().tabsets.values()]) {
      if (_.find(ts.tabs, t => t.chromeTab.url === url)) {
        tabsets.push(ts.id)
      }
    }
    return tabsets;
  }


  nameForTabsetId(tsId: string): string {
    return useTabsStore().tabsets.get(tsId)?.name || 'unknown'
  }

  async closeTrackedTabs() {
    // TODO long-Running action
    const currentTab = await ChromeApi.getCurrentTab()
    chrome.tabs.query({}, (result: chrome.tabs.Tab[]) => {
      const tabsToClose: chrome.tabs.Tab[] = []
      _.forEach(result, (tab: chrome.tabs.Tab) => {
        if (tab && tab.url && tab.url !== currentTab.url && this.tabsetsFor(tab.url).length > 0) {
          tabsToClose.push(tab)
        }
      })
      console.log("tabsToClose", tabsToClose)
      _.forEach(tabsToClose, (t: chrome.tabs.Tab) => {
        if (t.id) {
          chrome.tabs.remove(t.id)
        }
      })
    })
  }

  rename(tabsetId: string, tabsetName: string) {
    const tabset = this.getTabset(tabsetId)
    if (tabset) {
      tabset.name = tabsetName
      this.saveTabset(tabset)
    }
  }

}

export default new TabsetService();
