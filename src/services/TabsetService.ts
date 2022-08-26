import {useTabsStore} from "stores/tabsStore";
import {LocalStorage, uid} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import _ from "lodash";
import {Tab, TabStatus} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";

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

  restore(tabsetId: string) {
    console.log("restoring from tabset", tabsetId)
    const tabset = this.getTabset(tabsetId)
    if (tabset) {
      console.log("found tabset for id", tabsetId)
      const tabsStore = useTabsStore()
      ChromeApi.restore(tabset)
      tabsStore.context = tabset.name
      localStorage.setItem("tabsets.context", tabsetId)
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
      if (tabset.name === tabsStore.context) {
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


  saveOrReplace(name: string, tabs: chrome.tabs.Tab[]) {
    const tabsStore = useTabsStore()
    tabsStore.saveOrCreateTabset(name)
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
}

export default new TabsetService();

