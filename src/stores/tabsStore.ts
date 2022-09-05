import {defineStore} from 'pinia';
// @ts-ignore
import _ from 'lodash'
import {LocalStorage, uid} from "quasar";
import {Tabset} from "src/models/Tabset";
import {Tab, TabStatus} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import ChromeListeners from "src/services/ChromeListeners";
import ChromeApi from "src/services/ChromeApi";

async function queryTabs(): Promise<chrome.tabs.Tab[]> {
  return await chrome.tabs.query({currentWindow: true})
}

function markDuplicates(tabset: Tabset) {
  //console.log("marking duplicates in tabset", tabset.id)
  const urls = new Set<string>()
  const duplicates = new Set<string>()
  _.forEach(tabset.tabs, t => {
    if (urls.has(t.chromeTab.url || 'undefined')) {
      duplicates.add(t.chromeTab.url || 'undefined')
    } else {
      urls.add(t.chromeTab.url || 'undefined')
    }
  })
  //console.log("found duplicates", urls, duplicates)
  _.forEach(tabset.tabs, t => {
    if (duplicates.has(t.chromeTab.url || 'undefined')) {
      t.isDuplicate = true
    }
  })
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({

    // current context id (one of the tabsets ids, null if not set)
    contextId: null as unknown as string,

    // chrome's current's windows tabs, reloaded on various events
    tabs: [] as unknown as chrome.tabs.Tab[],

    /**
     * a named list of tabsets managed by this extension. There's a special
     * key 'current' which references the current state of the chrome tabs (see 'tabs' above)
     */
    tabsets: new Map<string, Tabset>(),

    // which tabset should be shown in the extension?
    currentTabsetId: 'current',

    // use listeners? Might make sense to turn them off when restoring old tabset for example
    listenersOn: true,

    // extension title
    //title: 'Tabset Extension',

    localStorage: undefined as unknown as LocalStorage
  }),

  getters: {
    isContextMode: (state) => state.contextId && state.currentTabsetId === state.contextId,
    isLiveMode: (state) => (state.contextId && state.currentTabsetId === 'current') || (!state.contextId && state.currentTabsetId === 'current'),
    isEditMode: (state) => (state.contextId && state.currentTabsetId !== state.contextId) || (!state.contextId && state.currentTabsetId !== 'current'),
    title: (state) => {
      if (state.contextId) {
        const tabset = _.head(_.filter([...state.tabsets.values()], ts => ts.id === state.contextId)) || new Tabset("", "undefined", [])
        return "Tabset: " + tabset.name
      }
      return "Tabset Extension"
    },
    pinnedTabs(state): Tab[] { //chrome.tabs.Tab[] {
      //console.log("state", state.currentTabsetId)
      //console.log("state", state.tabsets.get(state.currentTabsetId))
      const currentTabset: Tabset = state.tabsets.get(state.currentTabsetId) || new Tabset("", "", [])
      return _.filter(currentTabset.tabs, (t: Tab) => {
        //console.log("t", t.chromeTab, t)
        return t.chromeTab?.pinned
      })
    },
    pendingTabs(state): Tab[] {
      const currentTabset: Tabset = state.tabsets.get(state.currentTabsetId) || new Tabset("", "", [])
      return _.filter(currentTabset.tabs, (t: Tab) => {
        return t.status !== TabStatus.DEFAULT
      })
    },

    tabsCount(): number {
      return this.tabs.length
    },
    getChromeTabs: (state): chrome.tabs.Tab[] => state.tabs,
    tabsetNames: (state) => _.map([...state.tabsets.keys()], key => {
      const tabset = state.tabsets.get(key)
      return tabset?.name || 'unknown'
    }),
    getCurrentTabs: (state) => {
      // console.log("getCurrentTabs called for", state.currentTabsetId)
      // console.log("2", state.tabsets.get(state.currentTabsetId))
      // console.log("3", state.tabsets)
      return state.tabsets.get(state.currentTabsetId)?.tabs || []
    },
    currentTabsetName: (state) => {
      //console.log("here!", state.currentTabsetId)
      if (state.currentTabsetId !== 'current') {
        const tabset = _.head(_.filter([...state.tabsets.values()], ts => ts.id === state.currentTabsetId)) || new Tabset("", "undefined", [])
        return tabset.name
      }
      return 'current'
    },
    getNameForContext: (state): string => {
      return _.first(_.map(
        _.filter([...state.tabsets.values()],
          ts => ts.id === state.contextId),
        ts => ts.name)) || 'undefined'
    },
    tabForUrlInContextTabset: (state): (url: string) => Tab | undefined => {
      const tabs: Tab[] = state.tabsets.get(state.contextId)?.tabs || []
      return (url: string) => _.find(tabs, t => t.chromeTab.url === url)
    },
    tabIdExistsInContextTabset: (state) => {
      const tabs: Tab[] = state.tabsets.get(state.contextId)?.tabs || []
      return (tabId: number) => _.find(tabs, t => t.chromeTab.id === tabId)
    },
    tabsetsWithoutCurrent: (state) => _.filter([...state.tabsets.values()], ts => ts.id !== 'current')
  },

  actions: {
    async initialize(localStorage: LocalStorage) {
      console.log("initializing tabsStore")
      this.localStorage = localStorage

      // setting current tabs
      this.tabs = await queryTabs()
      // @ts-ignore
      const tabsFromBrowser = new Tabset("current", "current",
        _.map(this.tabs, t => {
          return new Tab(uid(), t)
        }))
      this.tabsets.set("current", tabsFromBrowser)

      // setting all tabs from local storage tabsets
      const currentContext = localStorage.getItem("tabsets.context") as string
      _.forEach(
        _.filter(localStorage.getAllKeys(),
          (t: string) => t.startsWith("tabsets.tabset.")),
        key => {
          const tabsetId = key.replace("tabsets.tabset.", "")
          const tabset: Tabset | null = localStorage.getItem(key)
          if (tabset) {
            console.log("setting tabset", key)
            this.tabsets.set(tabsetId, tabset)
            if (currentContext && currentContext === tabsetId) {
              console.log("setting current context", currentContext)
              this.contextId = tabset.id
              this.currentTabsetId = tabset.id
            }
          }
        })
      //
      // // marking duplicates (inside each tabset)
      // _.forEach([...this.tabsets.values()], tabset => markDuplicates(tabset))
    },
    async loadTabs(eventName: string) {
      // potentially expansive method
      // console.log(`${eventName}: -- loading tabs for tabset '${this.currentTabsetId}'`)
      console.log(`${eventName}: -- loading tabs for tabset 'current'`)
      this.tabs = await queryTabs()
      const current = new Tabset("current", "current",
        _.map(this.tabs, t => {
          return new Tab(uid(), t)
        }))
      markDuplicates(current)
      this.tabsets.set("current", current)
    },
    initListeners() {
      chrome.tabs.onCreated.addListener((tab: chrome.tabs.Tab) => ChromeListeners.onCreated(tab))
      chrome.tabs.onUpdated.addListener((number, info, tab) => ChromeListeners.onUpdated(number, info, tab))
      // chrome.tabs.onMoved.addListener((number, info) => ChromeListeners.onMoved(number, info))
      chrome.tabs.onRemoved.addListener((number, info) => ChromeListeners.onRemoved(number, info))
      chrome.tabs.onReplaced.addListener((n1, n2) => ChromeListeners.onReplaced(n1, n2))
      chrome.tabs.onActivated.addListener((info) => ChromeListeners.onActivated(info))
      // chrome.tabs.onAttached.addListener((number, info) => ChromeListeners.onAttached(number, info))
      // chrome.tabs.onDetached.addListener((number, info) => ChromeListeners.onDetached(number, info))
      // chrome.tabs.onHighlighted.addListener((info) => ChromeListeners.onHighlighted(info))
      // chrome.tabs.onZoomChange.addListener((info) => ChromeListeners.onZoomChange(info))
    },
    tabsForGroup(groupId: number): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
    },
    unpinnedTabsWithoutGroup(): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === -1 && !t.pinned)
    },
    selectCurrentTabset(tabsetId: string): void {
      // if ("current" === name) {
      //   console.log("setting tabs from chrome")
      //   // this.currentTabset = new Tabset("current", "current",
      //   //   _.map(this.tabs, t => {
      //   //     return new Tab(t)
      //   //   }))
      //   return
      // }
      const found = _.find([...this.tabsets.values()], k => {
        const ts = k || new Tabset("", "", [])
        return ts.id === tabsetId
      })
      if (found) {
        //console.log("found", found)
        this.currentTabsetId = tabsetId //this.tabsets.get(found) || new Tabset("", "", [])
      } else {
        console.error("not found", name)
      }
    },
    removeTab(tabId: number) {
      const currentTabset: Tabset = this.tabsets.get(this.currentTabsetId) || new Tabset("", "", [])
      currentTabset.tabs = _.filter(currentTabset.tabs, (t: Tab) => t.chromeTab.id !== tabId)
      TabsetService.saveTabset(currentTabset)
    },

    async saveOrCreateTabset(tabsetName: string): Promise<boolean> {
      console.log("--- saveOrCreateTabset start -------------")
      const found = _.find([...this.tabsets.values()], ts => ts.name === tabsetName)
      let ts: Tabset = null as unknown as Tabset
      const tabsetExtensionTab = await ChromeApi.getCurrentTab()
      if (found) {
        console.log("found existing tabset " + found.id + ", replacing...")
        ts = new Tabset(found.id, tabsetName, _.map(this.tabs, t => new Tab(uid(), t)));
        this.tabsets.set(found.id, ts)
        TabsetService.saveTabset(ts)

      } else {
        console.log("didn't find existing tabset, creating new...")
        const useId = uid()
        ts = new Tabset(useId, tabsetName, _.map(
          _.filter(
            this.tabs, t => {
              console.log("comparing", t.url, tabsetExtensionTab.url, t.url !== tabsetExtensionTab.url)
              return t.url !== tabsetExtensionTab.url
            }),
          t => new Tab(uid(), t)));
        console.log("got ts", ts)
        this.tabsets.set(useId, ts)
      }
      this.currentTabsetId = ts.id
      this.contextId = ts.id
      await TabsetService.saveTabset(ts)
      await this.localStorage.set("tabsets.context", this.contextId)
      console.log("--- saveOrCreateTabset end -------------")
      return found !== undefined;
    },

    deleteTabset(tabsetId: string) {

    },
    deactivateListeners() {
      console.log("setting listeners to false")
      this.listenersOn = false
    },
    activateListeners() {
      console.log("setting listeners to true")
      this.listenersOn = true
    }

  }
});
