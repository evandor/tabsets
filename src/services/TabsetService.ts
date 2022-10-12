import {useTabsStore} from "src/stores/tabsStore";
import {LocalStorage, uid} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import _ from "lodash";
import {Tab, TabStatus} from "src/models/Tab";
import {Tabset, TabsetPersistence, TabsetStatus} from "src/models/Tabset";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {IDBPDatabase, openDB} from "idb";
import backendApi from "src/services/BackendApi";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useAuthStore} from "src/stores/auth";
import {INDEX_DB_NAME} from "boot/constants";
import {AxiosResponse} from "axios";
import {SyncMode} from "src/models/Subscription";
import {useSearchStore} from "src/stores/searchStore";
import {useBookmarksStore} from "src/stores/bookmarksStore";

class TabsetService {

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  private localStorage: LocalStorage = null as unknown as LocalStorage

  setLocalStorage(localStorage: any) {
    this.localStorage = localStorage;
  }

  /**
   * Init, called when extension is loaded (via App.vue)
   */
  async init() {
    this.db = await this.initDatabase();
    useSearchStore().populate(this.db.getAll('content'))
    await this.loadTabsetsFromIndexDb();
    this.loadTabsetsFromFirebase()
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
      if (useFeatureTogglesStore().firebaseEnabled && useAuthStore().isAuthenticated && useAuthStore().subscription.syncMode === SyncMode.ACTIVE) {
        console.log("saving tabset to firebase")
        backendApi.saveTabset(tabset)
      } else {
        console.log("tabset", tabset)
        await this.db.put('tabsets', JSON.parse(JSON.stringify(tabset)), tabset.id);
      }
      //localStorage.setItem("tabsets.context", tabset.id)
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
        await ChromeApi.restore(tabset)
      }
    } catch (ex) {
      console.log("ex", ex)
    } finally {
      tabsStore.activateListeners()
    }
  }

  delete(tabsetId: string) {
    console.log("deleting tabset ", tabsetId)
    const tabset = this.getTabset(tabsetId)
    if (tabset) {
      const tabsStore = useTabsStore()
      _.forEach(tabsStore.getTabset(tabsetId)?.tabs, t => this.removeThumbnailsFor(t.chromeTab.url || ''))
      tabsStore.deleteTabset(tabsetId)
      this.db.delete('tabsets', tabsetId)
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

  // private findInLocalStorage(tabsetName: string): string | undefined {
  //   return _.first(
  //     _.map(
  //       _.filter(
  //         _.map(
  //           _.filter(this.localStorage.getAllKeys(), (t: string) => t.startsWith("tabsets.tabset.")),
  //           (key: string) => {
  //             //console.log("key", key)
  //             return this.localStorage.getItem(key)
  //           }), (ts: Tabset) => {
  //           //console.log("ts", ts.name, tabsetName)
  //           return ts.name === tabsetName
  //         }), (ts: any) => {
  //         //console.log("mapping to", ts.id)
  //         return ts.id as string
  //       }))
  // }

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

  saveToTabset(tab: Tab) {
    const tabsStore = useTabsStore()
    const currentTabset: Tabset = this.getCurrentTabset() || new Tabset("", "", [], [])
    tab.status = TabStatus.DEFAULT
    currentTabset.tabs.push(tab)

    const index = _.findIndex(tabsStore.pendingTabset.tabs, t => t.id === tab.id)
    tabsStore.pendingTabset.tabs.splice(index, 1);
    this.saveTabset(currentTabset)
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

  saveAllPendingTabs(onlySelected: boolean = false) {
    const tabsStore = useTabsStore()
    const currentTabset = tabsStore.getCurrentTabset

    if (currentTabset) {
      _.forEach(
        tabsStore.pendingTabset.tabs,
        t => {
          if (t.chromeTab?.id) {
            if (!onlySelected || (onlySelected && t.selected)) {
              currentTabset.tabs.push(t)
            }
          }
        })

      if (!onlySelected) {
        tabsStore.pendingTabset.tabs = []
      } else {
        _.remove(tabsStore.pendingTabset.tabs, {selected: true});
      }
      this.saveTabset(currentTabset)
    }
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
      this.db.put('thumbnails', {expires: new Date().getTime() + 1000 * 60 * 60, thumbnail: thumbnail}, encodedTabUrl)
        .then(ts => console.log("added thumbnail"))
        .catch(err => console.log("err", err))
    }
  }

  async getThumbnailFor(selectedTab: Tab): Promise<any> {
    //console.log("checking thumbnail for", selectedTab.chromeTab.url)
    if (selectedTab.chromeTab.url) {
      const encodedUrl = btoa(selectedTab.chromeTab.url)
      //console.log("encoded", encodedUrl)
      return await this.db.get('thumbnails', encodedUrl)
    }
    return Promise.reject("url not provided");
  }

  async getContentFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.chromeTab.url) {
      const encodedUrl = btoa(selectedTab.chromeTab.url)
      // console.log("encodedUrl",encodedUrl)
      return await this.db.get('content', encodedUrl)
    }
    return Promise.reject("url not provided");
  }

  removeThumbnailsFor(url: string): Promise<any> {
    return this.db.delete('thumbnails', btoa(url))
  }

  removeContentFor(url: string): Promise<any> {
    return this.db.delete('content', btoa(url))
  }

  saveText(tab: chrome.tabs.Tab | undefined, text: string) {
    if (tab && tab.url) {
      const encodedTabUrl = btoa(tab.url)
      const title = tab.title || ''
      const url = tab.url
      const tabsetIds: string[] = this.tabsetsFor(tab.url)
      //localStorage.setItem("tabsets.tab.xxx", thumbnail)
      this.db.put('content', {
        id: encodedTabUrl,
        expires: new Date().getTime() + 1000 * 60 * 60,
        title,
        url,
        content: text,
        tabsets: tabsetIds,
        favIconUrl: tab.favIconUrl
      }, encodedTabUrl)
        .then(ts => console.log("added content"))
        .catch(err => console.log("err", err))

      useSearchStore().addToIndex(encodedTabUrl, tab.title || '', tab.url, text, tabsetIds, tab.favIconUrl || '')
    }
  }

  setCustomTitle(tab: Tab, title: string) {
    tab.name = title
    this.saveCurrentTabset()
  }

  createPendingFromBrowserTabs() {
    console.log(`createPendingFromBrowserTabs`)
    const tabsStore = useTabsStore()
    // const maybeTab = tabsStore.tabForUrlInSelectedTabset(tab.pendingUrl || '')
    // if (maybeTab) {
    //   console.log(`onCreated: tab ${tab.id}: updating existing chromeTab.id: ${maybeTab.chromeTab.id} -> ${tab.id}`)
    //   maybeTab.chromeTab.id = tab.id
    //   return
    // }
    _.forEach(tabsStore.tabs, t => {
      tabsStore.pendingTabset.tabs.push(new Tab(uid(), t))
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

  syncTabset(tabsetId: string): Promise<AxiosResponse<string>> {
    const tabsStore = useTabsStore()
    const ts = tabsStore.getTabset(tabsetId)
    if (ts) {
      // const backend = initializeBackendApi(process.env.BACKEND_URL || "unknown", null)

      //const clonedTs = JSON.parse(JSON.stringify(ts))
      // console.log("cloned ts", ts, clonedTs)
      // clonedTs.status = TabsetStatus.DEFAULT
      // clonedTs.persistence = TabsetPersistence.FIREBASE
      return backendApi.saveTabset(ts)
        .then(res => {
          //ts.persistence = TabsetPersistence.FIREBASE
          // ts.status = TabsetStatus.UNMOUNTED
          // ts.persistence = TabsetPersistence.FIREBASE
          this.delete(ts.id)
          this.loadTabsetsFromFirebase()
          console.log("got backend answer: ", res)
          return res
        })
      // .catch(err => {
      //   console.error("err", err)
      // })
    }
    return Promise.reject("tabset '" + tabsetId + "' not found")

  }

  unsyncTabset(tabsetId: string): Promise<AxiosResponse<string>> {
    const tabsStore = useTabsStore()
    const ts = tabsStore.getTabset(tabsetId)
    if (ts) {
      ts.persistence = TabsetPersistence.INDEX_DB
      this.saveTabset(ts)
      // const backend = initializeBackendApi(process.env.BACKEND_URL || "unknown", null)

      //const clonedTs = JSON.parse(JSON.stringify(ts))
      // console.log("cloned ts", ts, clonedTs)
      // clonedTs.status = TabsetStatus.DEFAULT
      // clonedTs.persistence = TabsetPersistence.FIREBASE
      return backendApi.deleteTabset(tabsetId)
        .then(res => {
          //ts.persistence = TabsetPersistence.FIREBASE
          // ts.status = TabsetStatus.UNMOUNTED
          // ts.persistence = TabsetPersistence.FIREBASE
          //this.delete(ts.id)
          this.loadTabsetsFromFirebase()
          console.log("got backend answer: ", res)
          return res
        })
      // .catch(err => {
      //   console.error("err", err)
      // })
    }
    return Promise.reject("tabset '" + tabsetId + "' not found")

  }

  loadTabsetsFromFirebase() {
    const firebaseEnabled = useFeatureTogglesStore().firebaseEnabled
    const authenticated = useAuthStore().isAuthenticated
    if (firebaseEnabled && authenticated) {
      backendApi.getTabsets()
        .then(ts => {
          console.log("tabsets from firebase", ts.data)

          _.forEach(ts.data, (ts: Tabset) => {
            console.log("got tabset", ts)
            ts.persistence = TabsetPersistence.FIREBASE
            ts.status = TabsetStatus.DEFAULT
            useTabsStore().addTabset(ts)
          })
        })
        .catch(err => console.log("error", err))
    }
  }

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
    const objectStore = this.db.transaction("thumbnails", "readwrite").objectStore("thumbnails");
    let cursor = await objectStore.openCursor()
    while (cursor) {
      if (cursor.value.expires !== 0) {
        const exists: boolean = this.urlExistsInATabset(atob(cursor.key.toString()))
        if (exists) {
          objectStore.put({expires: 0, thumbnail: cursor.value.thumbnail}, cursor.key)
        } else {
          if (cursor.value.expires < new Date().getTime()) {
            objectStore.delete(cursor.key)
          }
        }
      }
      cursor = await cursor.continue();
    }
    // clean up contents
    const contentObjectStore = this.db.transaction("content", "readwrite").objectStore("content");
    let contentCursor = await contentObjectStore.openCursor()
    while (contentCursor) {
      if (contentCursor.value.expires !== 0) {
        const exists: boolean = this.urlExistsInATabset(atob(contentCursor.key.toString()))
        if (exists) {
          const data = contentCursor.value
          contentObjectStore.put({
              id: data.id,
              expires: 0,
              content: data.content,
              title: data.title,
              url: data.url,
              tabsets: data.tabsets,
              favIconUrl: data.favIconUrl
            },
            contentCursor.key)
        } else {
          if (contentCursor.value.expires < new Date().getTime()) {
            contentObjectStore.delete(contentCursor.key)
          }
        }
      }
      contentCursor = await contentCursor.continue();
    }
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

  private async initDatabase(): Promise<IDBPDatabase> {
    return await openDB(INDEX_DB_NAME, 1, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (!db.objectStoreNames.contains('tabsets')) {
          console.log("creating db tabsets")
          db.createObjectStore('tabsets');
        }
        if (!db.objectStoreNames.contains('thumbnails')) {
          console.log("creating db thumbnails")
          let store = db.createObjectStore('thumbnails');
          store.createIndex("expires", "expires", {unique: false});
        }
        if (!db.objectStoreNames.contains('content')) {
          console.log("creating db content")
          let store = db.createObjectStore('content');
          store.createIndex("expires", "expires", {unique: false});
        }
      },
    });
  }

  private async loadTabsetsFromIndexDb() {
    const tabsStore = useTabsStore()
    const keys: IDBValidKey[] = await this.db.getAllKeys('tabsets')
    _.forEach(keys, key => {
      this.db.get('tabsets', key)
        .then(ts => {
          if ('ignored' === key) {
            tabsStore.ignoredTabset = ts//JSON.parse(ts)
          } else {
            tabsStore.addTabset(ts)//JSON.parse(ts))
          }
        })
        .catch(err => console.log("err", err))
    })
  }

}

export default new TabsetService();

