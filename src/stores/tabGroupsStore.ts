import {defineStore} from 'pinia';

export const useTabGroupsStore = defineStore('tabGroups', {
  state: () => ({
    tabGroups: [] as unknown as chrome.tabGroups.TabGroup[]
  }),

  getters: {
    data(): chrome.tabGroups.TabGroup[] {
      return this.tabGroups
    }
  },

  actions: {
    loadTabGroups(eventName?: string) {
      this.tabGroups = []
      console.log("loading tabGroups", eventName)
      try {
        chrome.tabGroups.query({}, (ts: chrome.tabGroups.TabGroup[]) => {
          ts.forEach(t => {
            //console.log("ts", ts)
            this.tabGroups.push(t)
          })
        });
      } catch (e) {
        console.log("error", e);
      }
    },
    initListeners() {
      chrome.tabGroups.onCreated.addListener(() => {
        this.loadTabGroups('onCreated');
      })
      chrome.tabGroups.onUpdated.addListener(() => {
        this.loadTabGroups('onUpdated');
      })
      chrome.tabGroups.onRemoved.addListener(() => {
        this.loadTabGroups('onRemoved');
      })
      chrome.tabGroups.onMoved.addListener(() => {
        this.loadTabGroups('onMoved');
      })

    }
  }
});
