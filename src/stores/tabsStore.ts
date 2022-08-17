import {defineStore} from 'pinia';
// @ts-ignore
import _ from 'lodash'

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as unknown as chrome.tabs.Tab[]
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
    loadTabs(eventName?: string) {
      console.log("loading tabs", eventName)
      this.tabs = []
      chrome.tabs.query({currentWindow: true}, (ts: chrome.tabs.Tab[]) => {
        ts.forEach(t => {
          if (!t.url?.startsWith("chrome"))  {
            this.tabs.push(t)
          }
        })
        console.log(`found ${this.tabs.length} tabs`)
      });
    },
    initListeners() {
      chrome.tabs.onCreated.addListener((tab)=> {
        console.log("created new tab", tab)
        this.loadTabs('onCreated');
      })
      chrome.tabs.onUpdated.addListener(()=> {
        this.loadTabs('onUpdated');
      })
      chrome.tabs.onMoved.addListener(()=> {
        this.loadTabs('onMoved');
      })
      chrome.tabs.onRemoved.addListener(()=> {
        this.loadTabs('onRemoved');
      })
      chrome.tabs.onReplaced.addListener(()=> {
        this.loadTabs('onReplaced');
      })


    },
    tabsForGroup(groupId:number): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
    },
    unpinnedTabsWithoutGroup(): chrome.tabs.Tab[] {
      return _.filter(this.tabs, (t: chrome.tabs.Tab) => t.groupId === -1 && !t.pinned)
    },
  }
});
