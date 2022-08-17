import {defineStore} from 'pinia';
// @ts-ignore
import _ from 'lodash'
import {useLogStore} from "stores/logStore";

async function queryTabs(): Promise<chrome.tabs.Tab[]> {
  let ts = await chrome.tabs.query({currentWindow: true})
  //console.log("found", ts.length)
  return ts;
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as unknown as chrome.tabs.Tab[],
    logStore: useLogStore()
  }),

  getters: {
    pinnedTabs(): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.pinned)
    },

    tabsCount(): number {
      return this.tabs.length
    },
    getTabs: (state) => state.tabs
  },

  actions: {
    async loadTabs(eventName = '') {
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


    },
    tabsForGroup(groupId: number): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
    },
    unpinnedTabsWithoutGroup(): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === -1 && !t.pinned)
    },
  }
});
