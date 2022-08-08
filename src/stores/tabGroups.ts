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
    loadTabGroups() {
      this.tabGroups = []
      console.log("loading tabGroups")
      try {
        chrome.tabGroups.query({}, (ts: chrome.tabGroups.TabGroup[]) => {
          ts.forEach(t => {
            console.log("ts", ts)
            this.tabGroups.push(t)
          })
        });
      } catch (e) {
        console.log("error", e);
      }
    }
  }
});
