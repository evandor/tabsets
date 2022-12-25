import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import {uid} from "quasar";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useSearchStore} from "stores/searchStore";
import TabsetService from "src/services/TabsetService";
import {usePersistenceService} from "src/services/usePersistenceService";
import ChromeApi from "src/services/ChromeApi";
import {TabPredicate} from "src/domain/Types";
import {useLoggingServicee} from "src/services/useLoggingService";
import {Tabset} from "src/models/Tabset";
import {useNotificationsStore} from "stores/notificationsStore";

const {logger, TabLogger} = useLoggingServicee()
const {persistenceService} = usePersistenceService()

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
   */
  const saveOrReplaceFromChromeTabs = async (name: string, chromeTabs: chrome.tabs.Tab[], merge: boolean = false): Promise<object> => {
    const trustedName = name.replace(STRIP_CHARS_IN_USER_INPUT, '')
    const tabs: Tab[] = _.map(chromeTabs, t => new Tab(uid(), t))
    try {
      const result: NewOrReplacedTabset = await useTabsStore()
        .updateOrCreateTabset(trustedName, tabs, merge)
      if (result && result.tabset) {
        await TabsetService.saveTabset(result.tabset)
        result.tabset.tabs.forEach((tab: Tab) => {
          //const tabLogger = logger.withContext("")
          TabLogger.info(tab.chromeTab.url || '', "created tab!")
          //logger.info("created tab", tab.id)
        })
        selectTabset(result.tabset.id)
        useSearchStore().indexTabs(result.tabset.id, tabs)
        return {
          replaced: result.replaced,
          tabsetId: result.tabset.id,
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
      await TabsetService.saveTabset(result.tabset)
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
    return persistenceService.deleteThumbnail(url)
  }

  const deleteTabset = (tabsetId: string): Promise<string> => {
    logger.info("deleting tabset ", tabsetId)
    const tabset = getTabset(tabsetId)
    if (tabset) {
      const tabsStore = useTabsStore()
      _.forEach(tabsStore.getTabset(tabsetId)?.tabs, (t:Tab) => {
        TabLogger.info(t.chromeTab.url || '', "removing thumbnails")
        removeThumbnailsFor(t?.chromeTab.url || '')
      })
      tabsStore.deleteTabset(tabsetId)
      persistenceService.deleteTabset(tabsetId)
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
      return TabsetService.saveTabset(ts)
        .then((res) => tabsCount - tabsToKeep.length)
    }
    return Promise.reject("did not find tabset for id " + tabsetId)

  }

  return {
    saveOrReplaceFromChromeTabs,
    saveOrReplaceFromBookmarks,
    deleteFromTabset,
    deleteTabset,
    getTabset,
    getCurrentTabset,
    selectTabset
  }

}
