import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import {uid} from "quasar";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useSearchStore} from "src/stores/searchStore";
import ChromeApi from "src/services/ChromeApi";
import {TabPredicate} from "src/domain/Types";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {MetaLink} from "src/models/MetaLink";
import {RequestInfo} from "src/models/RequestInfo";

import {useDB} from "src/services/usePersistenceService";
import {TabLogger} from "src/logging/TabLogger";
import LoggingService from "src/services/LoggingService";
const {db} = useDB()

export function useTabsetService() {


  /**
   * Will create a new tabset (or update an existing one with matching name) from
   * the provided Chrome tabs.
   *
   * Use case: https://skysail.atlassian.net/wiki/spaces/TAB/pages/807927852/Creating+a+Tabset
   *
   * The tabset is created or updated in the store, and the new data is persisted.
   * If merge is false, potentially existing tabs will be removed first.
   *
   * @param name the tabset's name
   * @param chromeTabs an array of Chrome tabs
   * @param merge if true, the old values (if existent) and the new ones will be merged.
   * @param startSession if true, create a special 'session' tabset
   */
  const saveOrReplaceFromChromeTabs = async (
    name: string,
    chromeTabs: chrome.tabs.Tab[],
    merge: boolean = false,
    type: TabsetType = TabsetType.DEFAULT): Promise<object> => {

    const trustedName = name.replace(STRIP_CHARS_IN_USER_INPUT, '')
    const tabs: Tab[] = _.map(chromeTabs, t => new Tab(uid(), t))
    try {
      const result: NewOrReplacedTabset = await useTabsStore()
        .updateOrCreateTabset(trustedName, tabs, merge, type)
      if (result && result.tabset) {
        await saveTabset(result.tabset)
        result.tabset.tabs.forEach((tab: Tab) => {
          TabLogger.info(tab, "created tab")
        })
        selectTabset(result.tabset.id)
        useSearchStore().indexTabs(result.tabset.id, tabs)
        return {
          replaced: result.replaced,
          tabset: result.tabset,
          merged: merge
        }
      }
      return Promise.reject("could not update or create tabset")
    } catch (err) {
       return Promise.reject("problem updating or creating tabset: " + err)
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
  const saveOrReplaceFromBookmarks = async (name: string, bms: chrome.bookmarks.BookmarkTreeNode[], merge: boolean = false): Promise<object> => {
    const tabsStore = useTabsStore()
    const now = new Date().getTime()
    const tabs = _.map(_.filter(bms, bm => bm.url !== undefined), c => {
      const tab = new Tab(uid(), null as unknown as chrome.tabs.Tab)
      tab.bookmarkUrl = c.url
      tab.bookmarkId = c.id
      tab.created = c.dateAdded || 0
      tab.updated = now
      tab.chromeTab = ChromeApi.createChromeTabObject(c.title || '', c.url || '', '')
      return tab
    })
    const result = await tabsStore.updateOrCreateTabset(name, tabs, merge)
    if (result && result.tabset) {
      await saveTabset(result.tabset)
      selectTabset(result.tabset.id)
      return {
        tabsetId: result.tabset.id,
        replaced: result.replaced,
        merged: merge,
        updated: now
      }
    }
    return Promise.reject("could not import from bookmarks")
  }

  const getTabset = (tabsetId: string): Tabset | undefined => {
    const tabsStore = useTabsStore()
    return _.find([...tabsStore.tabsets.values()], ts => ts.id === tabsetId)
  }

  const getCurrentTabset = (): Tabset | undefined => {
    const tabsStore = useTabsStore()
    return tabsStore.tabsets.get(tabsStore.currentTabsetId)
  }

  const resetSelectedTabs = () => {
    const currentTabset = getCurrentTabset()
    if (currentTabset) {
      _.forEach(currentTabset.tabs, (t: Tab) => t.selected = false)
    }
    useNotificationsStore().setSelectedTab(null as unknown as Tab)
  }

  const selectTabset = (tabsetId: string): void => {
    console.debug("selecting tabset", tabsetId)
    const tabsStore = useTabsStore()
    resetSelectedTabs()
    tabsStore.currentTabsetId = tabsetId;
    localStorage.setItem("selectedTabset", tabsetId)
  }

  const removeThumbnailsFor = (url: string): Promise<any> => {
    return db.deleteThumbnail(url)
  }

  const deleteTabset = (tabsetId: string): Promise<string> => {
    LoggingService.logger.info("deleting tabset ", tabsetId)
    const tabset = getTabset(tabsetId)
    if (tabset) {
      const tabsStore = useTabsStore()
      _.forEach(tabsStore.getTabset(tabsetId)?.tabs, (t: Tab) => {
        TabLogger.info(t, "removing thumbnails")
        removeThumbnailsFor(t?.chromeTab.url || '')
      })
      tabsStore.deleteTabset(tabsetId)
      db.deleteTabset(tabsetId)
      //this.db.delete('tabsets', tabsetId)
      const nextKey: string = tabsStore.tabsets.keys().next().value
      console.log("setting next key to", nextKey)
      selectTabset(nextKey)
      return Promise.resolve("ok")
    }
    return Promise.reject("could not get tabset for id")
  }

  const deleteFromTabset = (tabsetId: any, predicate: TabPredicate): Promise<number> => {
    console.log("deleting from tabset")
    const ts = useTabsStore().getTabset(tabsetId)
    if (ts) {
      const tabsCount = ts.tabs.length
      const tabsToKeep: Tab[] = _.filter(ts.tabs, (t: Tab) => !predicate(t))
      console.debug("found tabsToKeep", tabsToKeep)
      ts.tabs = tabsToKeep
      return saveTabset(ts)
        .then((res) => tabsCount - tabsToKeep.length)
    }
    return Promise.reject("did not find tabset for id " + tabsetId)

  }

  const saveTabset = async (tabset: Tabset): Promise<IDBValidKey> => {
    if (tabset.id) {
      tabset.updated = new Date().getTime()
      return db.saveTabset(tabset)
    }
    return Promise.reject("tabset id not set")
  }

  const saveToTabsetId = async (tsId: string, tab: Tab): Promise<number> => {
    const ts = getTabset(tsId)
    if (ts) {
      return saveToTabset(ts, tab)
    }
    return Promise.reject("no tabset for give id " + tsId)
  }


  const saveCurrentTabset = (): Promise<any> => {
    const tabsStore = useTabsStore()
    const currentTabset = tabsStore.getCurrentTabset
    if (currentTabset) {
      return saveTabset(currentTabset)
    }
    return Promise.reject("current tabset could not be found")
  }
  /**
   * called when we have a text excerpt from the background script
   *
   * @param tab
   * @param text
   * @param metas
   */
  const saveText = (tab: chrome.tabs.Tab | undefined, text: string, metas: object) => {
    if (tab && tab.url) {
      const title = tab.title || ''
      const tabsetIds: string[] = tabsetsFor(tab.url)

      db.saveContent(tab, text, metas, title, tabsetIds)
        //.then(() => console.log("added content"))
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
              saveTabset(tabset)
            }
          })
        }
      })
    }
  }

  const saveMetaLinksFor = (tab: chrome.tabs.Tab, metaLinks: MetaLink[]) => {
    if (tab && tab.url) {
      db.saveMetaLinks(tab.url, metaLinks)
        .then(() => console.debug("added meta links"))
        .catch(err => console.log("err", err))
    }
  }

  const saveLinksFor = (tab: chrome.tabs.Tab, links: any) => {
    if (tab && tab.url) {
      db.saveLinks(tab.url, links)
        .then(() => console.debug("added links"))
        .catch(err => console.log("err", err))
    }
  }


  const tabsetsFor = (url: string): string[] => {
    const tabsets: string[] = []
    for (let ts of [...useTabsStore().tabsets.values()]) {
      if (ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE) {
        if (_.find(ts.tabs, t => t.chromeTab.url === url)) {
          tabsets.push(ts.id)
        }
      }
    }
    return tabsets;
  }

  const tabsetFor = (id: string): Tabset | undefined => {
    let tabset: Tabset | undefined = undefined
    for (let ts of [...useTabsStore().tabsets.values()]) {
      if (_.find(ts.tabs, t => t.id === id)) {
        tabset = ts
      }
    }
    return tabset
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
  const saveToTabset = async (ts: Tabset, tab: Tab, useIndex: number | undefined = undefined): Promise<number> => {
    //console.log("adding tab x to tabset y", tab.id, ts.id)
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

      return saveTabset(ts)
        .then(() => Promise.resolve(0)) // TODO
    }
    return Promise.reject("tab.chromeTab.url undefined")
  }

  const saveThumbnailFor = (tab: chrome.tabs.Tab | undefined, thumbnail: string) => {
    if (tab && tab.url) {
      db.saveThumbnail(tab, thumbnail)
        //.then(() => console.log("added thumbnail"))
        .catch(err => console.log("err", err))
    }
  }


  const saveRequestFor = (url: string, requestInfo: RequestInfo) => {
    if (url) {
      db.saveRequest(url, requestInfo)
        .then(() => console.debug("added request"))
        .catch(err => console.log("err", err))
    }
  }


  const removeContentFor = (url: string): Promise<any> => {
    return db.deleteContent(url)
  }


  /**
   * https://skysail.atlassian.net/wiki/spaces/TAB/pages/800849921/Tab+Handling
   *
   * @param tab to deal with
   */
  const closeTab = (tab: Tab) => {
    console.log("closing tab", tab.id, tab.chromeTab?.id)
    const tabUrl = tab.chromeTab?.url || ''
    if (tabsetsFor(tabUrl).length <= 1) {
      removeThumbnailsFor(tabUrl)
        .then(() => console.log("deleting thumbnail for ", tabUrl))
        .catch(err => console.log("error deleting thumbnail", err))

      removeContentFor(tabUrl)
        .then(() => console.log("deleting content for ", tabUrl))
        .catch(err => console.log("error deleting content", err))
    }
    const tabset = tabsetFor(tab.id)
    if (tabset) {
      useTabsStore().removeTab(tabset, tab.id)
      useNotificationsStore().unsetSelectedTab()
      return saveTabset(tabset)
        .then(() => tabset)
    }
    return Promise.reject("could not access current tabset")
  }

  const deleteTab = (tab: Tab): Promise<Tabset> => {
    console.log("deleting tab", tab.id, tab.chromeTab?.id)
    const tabUrl = tab.chromeTab?.url || ''
    if (tabsetsFor(tabUrl).length <= 1) {
      removeThumbnailsFor(tabUrl)
        .then(() => console.log("deleting thumbnail for ", tabUrl))
        .catch(err => console.log("error deleting thumbnail", err))

      removeContentFor(tabUrl)
        .then(() => console.log("deleting content for ", tabUrl))
        .catch(err => console.log("error deleting content", err))
    }
    const tabset = tabsetFor(tab.id)
    if (tabset) {
      useTabsStore().removeTab(tabset, tab.id)
      useNotificationsStore().unsetSelectedTab()
      return saveTabset(tabset)
        .then(() => tabset)
    }
    return Promise.reject("could not access current tabset")

  }

  const getIfAvailable = (metas: object, key: string): string | undefined => {
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

  const urlExistsInATabset = (url: string): boolean => {
    for (let ts of [...useTabsStore().tabsets.values()]) {
      if (_.find(ts.tabs, t => t.chromeTab.url === url)) {
        return true;
      }
    }
    return false;
  }
  const urlExistsInCurrentTabset = (url: string): boolean => {
    const currentTabset = getCurrentTabset()
    if (currentTabset) {
      if(_.find(currentTabset.tabs, t => t.chromeTab.url === url)) {
        return true
      }
    }
    return false;
  }

  return {
    saveOrReplaceFromChromeTabs,
    saveOrReplaceFromBookmarks,
    deleteFromTabset,
    deleteTabset,
    getTabset,
    getCurrentTabset,
    selectTabset,
    saveTabset,
    saveCurrentTabset,
    saveText,
    saveMetaLinksFor,
    saveLinksFor,
    saveToTabsetId,
    saveToTabset,
    tabsetsFor,
    saveThumbnailFor,
    //housekeeping,
    //saveRequestFor,
    removeThumbnailsFor,
    removeContentFor,
    closeTab,
    deleteTab,
    urlExistsInATabset,
    urlExistsInCurrentTabset
  }

}
