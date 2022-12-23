import {useTabsStore} from "src/stores/tabsStore";
import {LocalStorage, uid} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import _ from "lodash";
import {Tab} from "src/models/Tab";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useSearchStore} from "src/stores/searchStore";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService"
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {SearchDoc} from "src/models/SearchDoc";
import {RequestInfo} from "src/models/RequestInfo";
import {MetaLink} from "src/models/MetaLink";

function getIfAvailable(metas: object, key: string): string | undefined {
  let res = undefined
  _.forEach(Object.keys(metas), k => {
    const value = metas[k as keyof object] as string
    if (k.endsWith(key) && value && value.trim().length > 0) {
      //console.log("k>", k, value)
      res = value
    }
  })
  return res
}

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
    console.debug("initializing tabsetService")
    await this.persistenceService.loadTabsets()
    useSearchStore().populate(this.persistenceService.getContents())
  }


  async saveTabset(tabset: Tabset): Promise<IDBValidKey> {
    if (tabset.id) {
      return this.persistenceService.saveTabset(tabset)
    }
    return Promise.reject("tabset id not set")
  }

  saveCurrentTabset(): Promise<any> {
    const tabsStore = useTabsStore()
    const currentTabset = tabsStore.getCurrentTabset
    if (currentTabset) {
      return this.saveTabset(currentTabset)
    }
    return Promise.reject("current tabset could not be found")
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

  delete(tabsetId: string): Promise<string> {
    console.log("deleting tabset ", tabsetId)
    const tabset = this.getTabset(tabsetId)
    if (tabset) {
      const tabsStore = useTabsStore()
      _.forEach(tabsStore.getTabset(tabsetId)?.tabs, t => this.removeThumbnailsFor(t?.chromeTab.url || ''))
      tabsStore.deleteTabset(tabsetId)
      this.persistenceService.deleteTabset(tabsetId)
      //this.db.delete('tabsets', tabsetId)
      const nextKey: string = tabsStore.tabsets.keys().next().value
      console.log("setting next key to", nextKey)
      this.selectTabset(nextKey)
      return Promise.resolve("ok")
    }
    return Promise.reject("could not get tabset for id")
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

  async saveToCurrentTabset(tab: Tab, useIndex: number | undefined = undefined): Promise<number> {
    const currentTs = this.getCurrentTabset()
    if (currentTs) {
      return this.saveToTabset(currentTs, tab, useIndex)
    }
    return Promise.reject("could not get current tabset")
  }

  async saveToTabsetId(tsId: string, tab: Tab): Promise<number> {
    const ts = this.getTabset(tsId)
    if (ts) {
      return this.saveToTabset(ts, tab)
    }
    return Promise.reject("no tabset for give id " + tsId)
  }

  /**
   * adds the (new) Tab 'tab' to the tabset given in 'ts'.
   *
   * proceeds only if tab.chromeTab.url exists and the tab is not already contained in the tabset.
   * the tab is removed from the pending tabset if it exists there.
   *
   * @param ts
   * @param tab
   * @param useIndex
   */
  async saveToTabset(ts: Tabset, tab: Tab, useIndex: number | undefined = undefined): Promise<number> {
    console.log("adding tab x to tabset y", tab.id, ts.id)
    if (tab.chromeTab.url) {
      const indexInTabset = _.findIndex(ts.tabs, t => t.chromeTab.url === tab.chromeTab.url)
      if (indexInTabset >= 0) {
        return Promise.reject("tab exists already")
      }

      if (useIndex !== undefined && useIndex >= 0) {
        ts.tabs.splice(useIndex, 0, tab)
      } else {
        ts.tabs.push(tab)
      }

      return this.saveTabset(ts)
        .then(() => Promise.resolve(0)) // TODO
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
    return _.filter(tabsStore.tabs, t => {
      return t?.url === tabUrl
    }).length > 0
  }

  selectTabset(tabsetId: string): void {
    console.debug("selecting tabset", tabsetId)
    const tabsStore = useTabsStore()
    this.resetSelectedTabs()
    tabsStore.currentTabsetId = tabsetId;

    localStorage.setItem("selectedTabset", tabsetId)

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
      return this.saveTabset(currentTabset)
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
      this.persistenceService.saveThumbnail(tab.url, thumbnail)
        .then(() => console.log("added thumbnail"))
        .catch(err => console.log("err", err))
    }
  }

  saveRequestFor(url: string, requestInfo: RequestInfo) {
    if (url) {
      this.persistenceService.saveRequest(url, requestInfo)
        .then(() => console.debug("added request"))
        .catch(err => console.log("err", err))
    }
  }

  async getThumbnailFor(selectedTab: Tab): Promise<any> {
    //console.log("checking thumbnail for", selectedTab.chromeTab.url)
    if (selectedTab.chromeTab.url) {
      return this.persistenceService.getThumbnail(selectedTab.chromeTab.url)
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
    return this.persistenceService.getRequest(url)
  }

  async getContentFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.chromeTab.url) {
      return this.getContentForUrl(selectedTab.chromeTab.url)
    }
    return Promise.reject("url not provided");
  }

  async getContentForUrl(url: string): Promise<any> {
    return this.persistenceService.getContent(url)
  }

  removeThumbnailsFor(url: string): Promise<any> {
    return this.persistenceService.deleteThumbnail(url)
  }

  removeContentFor(url: string): Promise<any> {
    return this.persistenceService.deleteContent(url)

  }

  saveMetaLinksFor(tab: chrome.tabs.Tab, metaLinks: MetaLink[]) {
    if (tab && tab.url) {
      this.persistenceService.saveMetaLinks(tab.url, metaLinks)
        .then(() => console.debug("added meta links"))
        .catch(err => console.log("err", err))
    }
  }

  async getMetaLinksFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.chromeTab.url) {
      return this.getMetaLinksForUrl(selectedTab.chromeTab.url)
    }
    return Promise.reject("url not provided");
  }

  async getMetaLinksForUrl(url: string): Promise<any> {
    return this.persistenceService.getMetaLinks(url)
  }

  saveLinksFor(tab: chrome.tabs.Tab, links: any) {
    if (tab && tab.url) {
      this.persistenceService.saveLinks(tab.url, links)
        .then(() => console.debug("added links"))
        .catch(err => console.log("err", err))
    }
  }

  async getLinksFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.chromeTab.url) {
      return this.getLinksForUrl(selectedTab.chromeTab.url)
    }
    return Promise.reject("url not provided");
  }

  async getLinksForUrl(url: string): Promise<any> {
    return this.persistenceService.getLinks(url)
  }


  /**
   * called when we have a text excerpt from the background script
   *
   * @param tab
   * @param text
   * @param metas
   */
  saveText(tab: chrome.tabs.Tab | undefined, text: string, metas: object) {
    if (tab && tab.url) {
      const title = tab.title || ''
      const tabsetIds: string[] = this.tabsetsFor(tab.url)

      this.persistenceService.saveContent(tab, text, metas, title, tabsetIds)
        .then(() => console.log("added content"))
        .catch(err => console.log("err", err))

      // console.log("updating meta data for ", tabsetIds, tab.url)
      const tabsets = [...useTabsStore().tabsets.values()]
      tabsets.forEach((tabset: Tabset) => {
        if (tabset) {
          _.forEach(tabset.tabs, (t: Tab) => {
            //console.log("comparing", t.chromeTab.url, tab.url)
            if (t.chromeTab.url === tab.url) {
              //console.log(" ... in tab", tab.id)
              if (metas['description' as keyof object]) {
                t.description = metas['description' as keyof object]
                // @ts-ignore
                useSearchStore().update(tab.url, 'description', t.description)
              }
              if (metas['keywords' as keyof object]) {
                t.keywords = metas['keywords' as keyof object]
              }
              const author = getIfAvailable(metas, 'author')
              if (author) {
                t.author = author
              }
              const lastModified = getIfAvailable(metas, 'last-modified')
              if (lastModified) {
                t.lastModified = lastModified
              }
              const date = getIfAvailable(metas, 'date')
              if (date) {
                t.date = date
              }
              const image = getIfAvailable(metas, 'image')
              if (image) {
                t.image = image
              }
              //  console.log("updated", t)
            }
          })
          this.saveTabset(tabset)
        }
      })
    }
  }

  setCustomTitle(tab: Tab, title: string) {
    tab.name = title
    this.saveCurrentTabset()
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
      this.saveTabset(tabset)

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

  async housekeeping() {
    console.log("housekeeping now...")

    this.persistenceService.cleanUpTabsets()
    // clean up thumbnails
    this.persistenceService.cleanUpThumbnails()

    this.persistenceService.cleanUpRequests()

    this.persistenceService.cleanUpMetaLinks()

    this.persistenceService.cleanUpLinks()

    this.persistenceService.cleanUpContent()
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
      // console.log("tabsToClose", tabsToClose)
      _.forEach(tabsToClose, (t: chrome.tabs.Tab) => {
        if (t.id) {
          chrome.tabs.remove(t.id)
        }
      })
    })
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
    const tabset = this.getTabset(tabsetId)
    if (tabset) {
      const oldName = tabset.name
      tabset.name = trustedName
      return this.saveTabset(tabset)
        .then(() => Promise.resolve(oldName))
    }
    return Promise.reject("could not find tabset for id " + tabsetId)
  }

  canvasPosition(tabsetId: string, tabsetName: string) {
    const tabset = this.getTabset(tabsetId)
    if (tabset) {
      tabset.name = tabsetName
      this.saveTabset(tabset)
    }
  }

  moveTo(tabId: string, newIndex: number) {
    console.log("moving", tabId, newIndex)
    let tabs = useTabsStore().getCurrentTabs
    const oldIndex = _.findIndex(tabs, t => t.id === tabId)
    if (oldIndex >= 0) {
      const tab = tabs.splice(oldIndex, 1)[0];
      tabs.splice(newIndex, 0, tab);
      this.saveCurrentTabset()
    }
  }

  setView(tabsetId: string, view: string) {
    const tabset = useTabsStore().getTabset(tabsetId)
    if (tabset) {
      tabset.view = view
      this.saveTabset(tabset)
    }
  }

  setPosition(tabId: string, top: number, left: number) {
    const tab = _.find(this.getCurrentTabset()?.tabs, t => t.id === tabId)
    if (tab) {
      tab.canvasLeft = left
      tab.canvasTop = top
      this.saveCurrentTabset()
    }
  }

  saveNote(tabId: string, note: string, scheduledFor: Date | undefined): Promise<void> {
    console.log("got", tabId, note)
    const tab = _.find(this.getCurrentTabset()?.tabs, (t: Tab) => t.id === tabId)
    if (tab) {
      tab.note = note
      if (scheduledFor) {
        tab.scheduledFor = scheduledFor.getTime()
      }
      return this.saveCurrentTabset()
    }
    return Promise.reject("did not find tab with id " + tabId)
  }


  // toggleFavorite(id: string): Promise<boolean> {
  //   console.log("toggling favorite for", id)
  //   const ts = this.getTabset(id)
  //   if (ts) {
  //     switch (ts.status) {
  //       case TabsetStatus.DEFAULT:
  //         ts.status = TabsetStatus.FAVORITE
  //         break
  //       case TabsetStatus.FAVORITE:
  //         ts.status = TabsetStatus.DEFAULT
  //         break
  //       default:
  //     }
  //     return this.saveTabset(ts)
  //       .then(() => true)
  //   }
  //   return Promise.reject("could not toggle archive flag for " + id)
  // }

  // toggleArchived(id: string): Promise<boolean> {
  //   console.log("toggling archived flag for", id)
  //   const ts = this.getTabset(id)
  //   if (ts) {
  //     switch (ts.status) {
  //       case TabsetStatus.ARCHIVED:
  //         ts.status = TabsetStatus.DEFAULT
  //         break
  //       case TabsetStatus.FAVORITE:
  //         ts.status = TabsetStatus.ARCHIVED
  //         break
  //       case TabsetStatus.DEFAULT:
  //         ts.status = TabsetStatus.ARCHIVED
  //         break
  //       default:
  //
  //     }
  //     return this.saveTabset(ts)
  //       .then(() => true)
  //   }
  //   return Promise.reject("could not toggle archive flag for " + id)
  // }

  markAsDeleted(tabsetId: string): Promise<boolean> {
    const ts = this.getTabset(tabsetId)
    if (ts) {
      ts.status = TabsetStatus.DELETED
      return this.saveTabset(ts)
        .then(() => true)
    }
    return Promise.reject("could not mark as deleted: " + tabsetId)
  }

  markAs(tabsetId: string, status: TabsetStatus): Promise<TabsetStatus> {
    console.debug(`marking ${tabsetId} as ${status}`)
    const ts = this.getTabset(tabsetId)
    if (ts) {
      const oldStatus = ts.status
      ts.status = status
      return this.saveTabset(ts)
        .then(() => oldStatus)
    }
    return Promise.reject("could not change status : " + tabsetId)
  }
}

export default new TabsetService();
