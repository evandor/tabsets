import {useTabsStore} from "stores/tabsStore";
import {LocalStorage, uid} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import _ from "lodash";
import {Tab, TabStatus} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";
import Navigation from "src/services/Navigation";

class TabsetService {

  private localStorage: LocalStorage = null as unknown as LocalStorage

  setLocalStorage(localStorage: LocalStorage) {
    this.localStorage = localStorage;
  }

  async createNewTabset(tabsetName: string, closeTabs: boolean) {
    console.log("creating new tabset", tabsetName, closeTabs)
    if (closeTabs) {
      console.log("calling chromeApi: closeAllTabs")
      await ChromeApi.closeAllTabs()
      //console.log("calling chromeApi: closeAllTabs - finished")
    }
    const tabsStore = useTabsStore()
    tabsStore.saveOrCreateTabset(tabsetName)
  }

  async restore(tabsetId: string) {
    console.log("restoring from tabset", tabsetId)
    const tabsStore = useTabsStore()
    try {
      tabsStore.deactivateListeners()
      const tabset = this.getTabset(tabsetId)
      if (tabset) {
        console.log("found tabset for id", tabsetId)
        await ChromeApi.restore(tabset)
        tabsStore.contextId = tabset.name
        localStorage.setItem("tabsets.context", tabsetId)
      }
    } catch (ex) {
      console.log("ex", ex)
    } finally {
      tabsStore.activateListeners()
    }

  }

  saveTabset(tabset: Tabset) {
    if ("current" === tabset.id) {
      return
    }
    if (tabset.id) {
      this.localStorage.set("tabsets.tabset." + tabset.id, tabset)
      //localStorage.setItem("tabsets.context", tabset.id)
      return
    }
    const existingId = this.findInLocalStorage(tabset.name)
    if (existingId) {
      console.log("updating tabset", existingId)
      this.localStorage.set("tabsets.tabset." + existingId, tabset)
    } else {
      console.log(`did not find id for tabset '${tabset.name}', creating new`)
      this.localStorage.set("tabset.tabset." + uid(), tabset)
    }
  }

  delete(tabsetId: string) {
    console.log("deleting tabset ", tabsetId)
    const tabset = this.getTabset(tabsetId)
    if (tabset) {
      const tabsStore = useTabsStore()
      if (tabset.name === tabsStore.contextId) {
        console.log("cannot delete currently active context")
        return
      }
      //tabsStore.deleteTabset(tabsetId)
      this.localStorage.remove("tabsets.tabset." + tabsetId)
      tabsStore.loadTabs('delete tabset event')
    }
  }

  private getTabset(tabsetId: string): Tabset | null {
    return this.localStorage.getItem<Tabset>("tabsets.tabset." + tabsetId);
  }

  private findInLocalStorage(tabsetName: string): string | undefined {
    return _.first(
      _.map(
        _.filter(
          _.map(
            _.filter(this.localStorage.getAllKeys(), (t: string) => t.startsWith("tabsets.tabset.")),
            (key: string) => {
              //console.log("key", key)
              return this.localStorage.getItem(key)
            }), (ts: Tabset) => {
            //console.log("ts", ts.name, tabsetName)
            return ts.name === tabsetName
          }), (ts: any) => {
          //console.log("mapping to", ts.id)
          return ts.id as string
        }))
  }


  setStatus(tabId: number, status: TabStatus) {
    const tabsStore = useTabsStore()
    const currentTabset: Tabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) || new Tabset("", "", [])
    _.forEach(
      _.filter(currentTabset.tabs, (t: Tab) => t.chromeTab.id === tabId),
      r => r.status = status)
    this.saveTabset(currentTabset)
  }

  /**
   * Will create a new tabset (or update an existing one with matching name) with
   * the provided Chrome tabs.
   *
   * @param name the tabset's name (TODO: validation)
   * @param tabs an array of Chrome tabs.
   */
  saveOrReplace(name: string, tabs: chrome.tabs.Tab[]) {
    useTabsStore().saveOrCreateTabset(name)
  }

  togglePin(tabId: number) {
    const tabsStore = useTabsStore()
    const currentTabset: Tabset = tabsStore.tabsets.get(tabsStore.currentTabsetId) || new Tabset("", "", [])
    _.filter(currentTabset.tabs, t => t.chromeTab.id === tabId)
      .forEach(t => {
        t.chromeTab.pinned = !t.chromeTab.pinned
        chrome.tabs.update(tabId, {pinned: t.chromeTab.pinned})
      })
  }

  unsetContext() {
    const tabsStore = useTabsStore()
    this.localStorage.remove("tabsets.context")
    tabsStore.contextId = null as unknown as string
  }

  setContext(currentTabsetId: string) {
    const tabsStore = useTabsStore()
    this.localStorage.set("tabsets.context", currentTabsetId)
    tabsStore.contextId = currentTabsetId
  }

  isOpen(tabUrl: string): boolean {
    const tabsStore = useTabsStore()
    //console.log("checking tabUrl", tabUrl)
    return _.filter(tabsStore.tabs, t => {
      return t?.url === tabUrl
    }).length > 0
  }

  selectTabset(tabsetId: string): void {
    const tabsStore = useTabsStore()
    tabsStore.currentTabsetId = tabsetId;
  }

  closeAllTabs() {
    // all but 'self'
    ChromeApi.closeAllTabs()
  }

  removeClosedTabs() {
    const tabsStore = useTabsStore()
    // console.log("removing closed tabs", tabsStore.pendingTabs)
    _.forEach(
      _.filter(
        tabsStore.pendingTabs,
        t => t.status === TabStatus.DELETED),
      deletedTab => tabsStore.removeTab(deletedTab.chromeTab.id || 0))

//    this.tabsStore.removeTab(tab.id)
  }

  saveAllPendingTabs() {
    const tabsStore = useTabsStore()
    _.forEach(
      tabsStore.pendingTabs,
      t => {
        if (t.chromeTab?.id) {
          this.setStatus(t.chromeTab.id, TabStatus.DEFAULT)
        }
      })
  }

  removeAllPendingTabs() {
    const tabsStore = useTabsStore()
    _.forEach(
      tabsStore.pendingTabs,
      t => {
        if (t.chromeTab?.id) {
          Navigation.closeTab(t.chromeTab)
        }
      })
  }
}

export default new TabsetService();

