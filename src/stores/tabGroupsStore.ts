import {defineStore} from 'pinia';

// @ts-ignore
async function queryTabGroups(): Promise<chrome.tabGroups.TabGroup[]> {
  // @ts-ignore
  let ts = await chrome.tabGroups.query({})
  //console.log("found", ts.length)
  return ts;
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
    loadTabGroups(eventName = '') {
      console.log("loading tabgroups", eventName)
      queryTabGroups().then(tgs => this.tabGroups = tgs);
    },
    initListeners() {
      // @ts-ignore
      chrome.tabGroups.onCreated.addListener((tg) => {
        let msg = `tabGroup ${tg.title} created`
        console.log('onCreated', msg)
        this.loadTabGroups('onCreated');
      })
      // @ts-ignore
      chrome.tabGroups.onUpdated.addListener((tg) => {
        let msg = `tabGroup ${tg.title} updated`
        console.log('onUpdated', msg)
        this.loadTabGroups('onUpdated');
      })
      // @ts-ignore
      chrome.tabGroups.onRemoved.addListener((tg) => {
        let msg = `tabGroup ${tg.title} removed`
        console.log('onRemoved', msg)
        this.loadTabGroups('onRemoved');
      })
      // @ts-ignore
      chrome.tabGroups.onMoved.addListener((tg) => {
        let msg = `tabGroup ${tg.title} moved`
        console.log('onMoved', msg)
        this.loadTabGroups('onMoved');
      })

    }
  }
});
