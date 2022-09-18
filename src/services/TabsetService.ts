import {useTabsStore} from "src/stores/tabsStore";
import {LocalStorage, uid} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import _ from "lodash";
import {Tab, TabStatus} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {IDBPDatabase, openDB} from "idb";

class TabsetService {

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  private localStorage: LocalStorage = null as unknown as LocalStorage

  setLocalStorage(localStorage: any) {
    this.localStorage = localStorage;
  }

  async init() {
    this.db = await openDB('db', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tabsets')) {
          console.log("creating db tabsets")
          db.createObjectStore('tabsets');
        }
        if (!db.objectStoreNames.contains('thumbnails')) {
          console.log("creating db thumbnails")
          db.createObjectStore('thumbnails');
        }
      },
    });

    const active = localStorage.getItem("active")
    if (active) {
      useTabsStore().active = active === "__q_bool|1"
    }

    // --- setting all tabs from storage
    const tabsStore = useTabsStore()
    const keys: IDBValidKey[] = await this.db.getAllKeys('tabsets')
    _.forEach(keys, k => {
      this.db.get('tabsets', k)
        .then(ts => tabsStore.addTabset(JSON.parse(ts)))
        .catch(err => console.log("err", err))
    })


  }

  /**
   * Will create a new tabset (or update an existing one with matching name) with
   * the provided Chrome tabs.
   *
   * The tabset is created or updated in the store, and the new data is persisted.
   *
   * @param name the tabset's name (TODO: validation)
   * @param tabs an array of Chrome tabs.
   * @param merge if true, the old values and the new ones will be merged.
   */
  async saveOrReplace(name: string, tabs: chrome.tabs.Tab[], merge: boolean = false): Promise<object> {
    const tabsStore = useTabsStore()
    const result = await tabsStore.updateOrCreateTabset(name, tabs, merge)
    if (result && result.tabset) {
      await this.saveTabset(result.tabset)
      tabsStore.currentTabsetId = result.tabset.id
    }
    return {
      replaced: result.replaced,
      merged: merge
    }
  }

  async saveTabset(tabset: Tabset) {
    if ("current" === tabset.id) {
      return
    }
    if (tabset.id) {
      //this.localStorage.set("tabsets.tabset." + tabset.id, tabset)
      await this.db.put('tabsets', JSON.stringify(tabset), tabset.id);
      //localStorage.setItem("tabsets.context", tabset.id)
      return
    }
    console.error("error - why here?")
    const existingId = this.findInLocalStorage(tabset.name)
    if (existingId) {
      console.log("updating tabset", existingId)
      //this.localStorage.set("tabsets.tabset." + existingId, tabset)
      await this.db.put('tabsets', JSON.stringify(tabset), existingId);
    } else {
      console.log(`did not find id for tabset '${tabset.name}', creating new`)
      this.localStorage.set("tabset.tabset." + uid(), tabset)
      await this.db.put('tabsets', JSON.stringify(tabset), uid());
    }
  }

  saveCurrentTabset() {
    const tabsStore = useTabsStore()
    const currentTabset = tabsStore.getCurrentTabset
    if (currentTabset) {
      this.saveTabset(currentTabset)
    }
  }

  // async createNewTabset(tabsetName: string, closeTabs: boolean) {
  //   console.log("creating new tabset", tabsetName, closeTabs)
  //   if (closeTabs) {
  //     console.log("calling chromeApi: closeAllTabs")
  //     await ChromeApi.closeAllTabs()
  //     //console.log("calling chromeApi: closeAllTabs - finished")
  //   }
  //   const tabsStore = useTabsStore()
  //   tabsStore.saveOrCreateTabset(tabsetName)
  // }

  async restore(tabsetId: string) {
    console.log("restoring from tabset", tabsetId)
    const tabsStore = useTabsStore()
    try {
      tabsStore.deactivateListeners()
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
      tabsStore.deleteTabset(tabsetId)
      this.db.delete('tabsets', tabsetId)
      const nextKey:string = tabsStore.tabsets.keys().next().value
      console.log("setting next key to", nextKey)
      this.selectTabset(nextKey)
    }
  }

  private getTabset(tabsetId: string): Tabset | undefined {
    //return this.localStorage.getItem<Tabset>("tabsets.tabset." + tabsetId);
    const tabsStore = useTabsStore()
    return _.find([...tabsStore.tabsets.values()], ts => ts.id === tabsetId)
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

  getCurrentTabset(): Tabset | undefined {
    const tabsStore = useTabsStore()
    return tabsStore.tabsets.get(tabsStore.currentTabsetId)
  }


  setStatus(tabId: number, status: TabStatus) {
    const tabsStore = useTabsStore()
    const currentTabset: Tabset = this.getCurrentTabset() || new Tabset("", "", [], [])
    _.forEach(
      _.filter(currentTabset.tabs, (t: Tab) => t.chromeTab.id === tabId),
      r => r.status = status)
    this.saveTabset(currentTabset)
  }

  saveToTabset(tab: Tab) {
    const tabsStore = useTabsStore()
    const currentTabset: Tabset = this.getCurrentTabset() || new Tabset("", "", [], [])
    console.log("got tabset", currentTabset)
    tab.status = TabStatus.DEFAULT
    currentTabset.tabs.push(tab)

    const index = _.findIndex(tabsStore.pendingTabset.tabs, t => t.id === tab.id)
    console.log("found", index)
    tabsStore.pendingTabset.tabs.splice(index, 1);
    // _.forEach(
    //   _.filter(currentTabset.tabs, (t: Tab) => t.chromeTab.id === tabId),
    //   r => r.status = status)
    this.saveTabset(currentTabset)
  }

  togglePin(tabId: number) {
    const tabsStore = useTabsStore()
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
  }

//   removeClosedTabs() {
//     const tabsStore = useTabsStore()
//     // console.log("removing closed tabs", tabsStore.pendingTabs)
//     _.forEach(
//       _.filter(
//         tabsStore.pendingTabs,
//         t => t.status === TabStatus.DELETED),
//       deletedTab => tabsStore.removeTab(deletedTab.chromeTab.id || 0))
//
// //    this.tabsStore.removeTab(tab.id)
//   }

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
      this.db.put('thumbnails', thumbnail, encodedTabUrl)
        .then(ts => console.log("added thumbnail"))
        .catch(err => console.log("err", err))
    }
  }

  async getThumbnailFor(selectedTab: Tab): Promise<any> {
    console.log("checking thumbnail for", selectedTab.chromeTab.url)
    if (selectedTab.chromeTab.url) {
      const encodedUrl = btoa(selectedTab.chromeTab.url)
      console.log("encoded", encodedUrl)
      return await this.db.get('thumbnails', encodedUrl)
    }
    return Promise.reject("url not provided");
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
}

export default new TabsetService();

