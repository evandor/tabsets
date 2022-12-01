import {defineStore} from 'pinia';
import ChromeTabGroupsListeners from "src/services/ChromeTabGroupsListeners";

// @ts-ignore
async function queryTabGroups(): Promise<chrome.tabGroups.TabGroup[]> {
  // @ts-ignore
  return await chrome.tabGroups.query({})
}

export const useTabGroupsStore = defineStore('tabGroups', {
  state: () => ({
    // @ts-ignore
    tabGroups: [] as unknown as chrome.tabGroups.TabGroup[],
  }),

  getters: {
    // data(): chrome.tabGroups.TabGroup[] {
    //   return this.tabGroups
    // }
  },

  actions: {
    initialize(eventName = '') {
      console.log("initializing tabGroupsStore", eventName)

      this.loadTabGroups()
    },
    loadTabGroups() {
      if (process.env.MODE === 'bex') {
        queryTabGroups().then(tgs => this.tabGroups = tgs);
      }
    },
    initListeners() {
      if (process.env.MODE === 'bex') {
        console.log("initializing chrome tabGroups Listeners")

        // @ts-ignore
        chrome.tabGroups.onCreated.addListener((tabGroup: chrome.tabGroups.TabGroup) => ChromeTabGroupsListeners.onCreated(tabGroup))
        // @ts-ignore
        chrome.tabGroups.onUpdated.addListener((tabGroup: chrome.tabGroups.TabGroup) => ChromeTabGroupsListeners.onUpdated(tabGroup))
        // @ts-ignore
        chrome.tabGroups.onRemoved.addListener((tabGroup: chrome.tabGroups.TabGroup) => ChromeTabGroupsListeners.onRemoved(tabGroup))
        // @ts-ignore
        chrome.tabGroups.onMoved.addListener((tabGroup: chrome.tabGroups.TabGroup) => ChromeTabGroupsListeners.onMoved(tabGroup))
      }
    }
  }
});
