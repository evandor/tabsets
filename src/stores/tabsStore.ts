import {defineStore} from 'pinia';
// @ts-ignore
import _ from 'lodash'
import {useLogStore} from "stores/logStore";
import {TabsetApi} from "src/services/TabsetApi";
import {LocalStorage, useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";
import {Tab} from "src/models/Tab";

async function queryTabs(): Promise<chrome.tabs.Tab[]> {
  return await chrome.tabs.query({currentWindow: true})
}

async function getCurrentTab() {
  let queryOptions = {active: true, lastFocusedWindow: true};
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    // chrome's current's windows tabs, reloaded on various events
    tabs: [] as unknown as chrome.tabs.Tab[],
    // a named list of tabsets managed by this extension
    tabsets: new Map<string, Tabset>(),
    // which tabset should be shown in the extension?
    currentTabset: new Tabset("", "", []),
    // audit
    logStore: useLogStore()
  }),

  getters: {
    pinnedTabs(state): Tab[] { //chrome.tabs.Tab[] {
      //return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.pinned)
      return _.filter(state.currentTabset.tabs, (t: Tab) => {
        //console.log("t.chromeTab", t.chromeTab)
        return t.chromeTab?.pinned
      })
    },

    tabsCount(): number {
      return this.tabs.length
    },
    getTabs: (state) => state.tabs,
    tabsetNames: (state) => _.map([...state.tabsets.keys()], key => {
      const tabset = state.tabsets.get(key)
      return tabset?.name || 'unknown'
    })
  },

  actions: {
    async initialize(localStorage: LocalStorage) {
      console.log("initializing tabsStore")
      this.logStore.add("loading tabs", [])
      queryTabs().then(ts => {
        this.tabs = ts
        // @ts-ignore
        this.currentTabset = new Tabset("current", "current",
          _.map(this.tabs, t => {
            return new Tab(t)
          }))
      });
      _.forEach(
        _.filter(localStorage.getAllKeys(),
          (t: string) => t.startsWith("bookmrkx.tabsContexts.")),
        key => {
          const tabset: Tabset | null = localStorage.getItem(key)
          if (tabset) {
            console.log("setting tabset", key)
            this.tabsets.set(key, tabset)
          }
        })
    },
    async loadTabs(eventName: string) {
      console.log("loading tabs", eventName)
      this.logStore.add("loading tabs", [])
      queryTabs().then(ts => this.tabs = ts);


    },
    initListeners() {
      chrome.tabs.onCreated.addListener((tab) => {
        this.logStore.add("new tab created", [tab.url || '?'])
        this.loadTabs('onCreated');
      })
      chrome.tabs.onUpdated.addListener((number, info, tab) => {
        if (!info.status) {
          let msg = `tab ${number} updated: ${JSON.stringify(info)}`
          console.log('onUpdated', msg)
          this.logStore.add(msg, [info.url || '?'])
          this.loadTabs('onUpdated');
        }
      })
      chrome.tabs.onMoved.addListener((n, info) => {
        this.logStore.add(`tab ${n} moved: ${JSON.stringify(info)}`, [])
        this.loadTabs('onMoved');
      })
      chrome.tabs.onRemoved.addListener((number, info) => {
        this.logStore.add(`tab ${number} removed: ${JSON.stringify(info)}`, [])
        this.loadTabs('onRemoved');
      })
      chrome.tabs.onReplaced.addListener((n1, n2) => {
        this.logStore.add(`tab ${n1} replaced ${n2}`, [])
        this.loadTabs('onReplaced');
      })
      //chrome.tabs.onActivated


    },
    tabsForGroup(groupId: number): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
    },
    unpinnedTabsWithoutGroup(): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === -1 && !t.pinned)
    },
    selectCurrentTabset(name: string): void {
      if ("Current" === name) {
        console.log("setting tabs from chrome")
        this.currentTabset = new Tabset("current", "current",
          _.map(this.tabs, t => {
            return new Tab(t)
          }))
        return
      }
      const found = _.find([...this.tabsets.keys()], k => {
        const ts = this.tabsets.get(k) || new Tabset("", "", [])
        return ts.name === name
      })
      if (found) {
        console.log("found", found)
        this.currentTabset = this.tabsets.get(found) || new Tabset("", "", [])
      } else {
        console.error("not found", name)
      }
    }
  }
});
