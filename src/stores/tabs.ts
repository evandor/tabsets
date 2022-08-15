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
    }
  },

  actions: {
    loadTabs() {
      console.log("loading tabs")
      this.tabs = []
      chrome.tabs.query({currentWindow: true}, (ts: chrome.tabs.Tab[]) => {
        //console.log("tabs", ts);
        ts.forEach(t => {
          if (!t.url?.startsWith("chrome"))  {
            this.tabs.push(t)
          }
        })
      });
      chrome.tabs.onCreated.addListener(()=> {
        console.log("onCreated event")
        this.loadTabs();
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
