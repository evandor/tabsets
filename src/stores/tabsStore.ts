import {defineStore} from 'pinia';
// @ts-ignore
import _ from 'lodash'
import {useLogStore} from "stores/logStore";

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
    loadTabs(eventName = '') {
      console.log("loading tabs", eventName)
      this.logStore.add("loading tabs", [])
      this.tabs = []
      chrome.tabs.query({currentWindow: true}, (ts: chrome.tabs.Tab[]) => {
        ts.forEach(t => {
          if (!t.url?.startsWith("chrome")) {
            this.tabs.push(t)
          }
        })
        console.log(`found ${this.tabs.length} tabs`)
      });
    },
    initListeners() {
      chrome.tabs.onCreated.addListener((tab) => {
        this.logStore.add("new tab created", [tab.url || '?'])
        this.loadTabs('onCreated');
      })
      chrome.tabs.onUpdated.addListener((number, info) => {
        this.logStore.add(`tab ${number} updated: ${JSON.stringify(info)}`, [info.url || '?'])
        this.loadTabs('onUpdated');
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
