import {defineStore} from 'pinia';
import {useLogStore} from "stores/logStore";

async function queryTabGroups(): Promise<chrome.tabGroups.TabGroup[]> {
  let ts = await chrome.tabGroups.query({})
  console.log("found", ts.length)
  return ts;
}

export const useTabGroupsStore = defineStore('tabGroups', {
  state: () => ({
    tabGroups: [] as unknown as chrome.tabGroups.TabGroup[],
    logStore: useLogStore()
  }),

  getters: {
    // data(): chrome.tabGroups.TabGroup[] {
    //   return this.tabGroups
    // }
  },

  actions: {
    loadTabGroups(eventName = '') {
      console.log("loading tabgroups", eventName)
      this.logStore.add("loading tabgroups", [])
      queryTabGroups().then(tgs => this.tabGroups = tgs);
    },
    initListeners() {
      chrome.tabGroups.onCreated.addListener((tg) => {
        let msg = `tabGroup ${tg.title} created`
        console.log('onCreated', msg)
        this.logStore.add(msg, [])
        this.loadTabGroups('onCreated');
      })
      chrome.tabGroups.onUpdated.addListener((tg) => {
        let msg = `tabGroup ${tg.title} updated`
        console.log('onUpdated', msg)
        this.logStore.add(msg, [])
        this.loadTabGroups('onUpdated');
      })
      chrome.tabGroups.onRemoved.addListener((tg) => {
        let msg = `tabGroup ${tg.title} removed`
        console.log('onRemoved', msg)
        this.logStore.add(msg, [])
        this.loadTabGroups('onRemoved');
      })
      chrome.tabGroups.onMoved.addListener((tg) => {
        let msg = `tabGroup ${tg.title} moved`
        console.log('onMoved', msg)
        this.logStore.add(msg, [])
        this.loadTabGroups('onMoved');
      })

    }
  }
});
