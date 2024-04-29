import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch, watchEffect} from "vue";
import ChromeApi from "src/services/ChromeApi";
import {Tabset} from "src/tabsets/models/Tabset";
import {Tab} from "src/tabsets/models/Tab";
import {uid} from "quasar";

async function queryTabs(): Promise<chrome.tabs.Tab[]> {
  // @ts-ignore
  return await chrome.tabs.query({currentWindow: true});
}

/**
 * a pinia store for "browsertabs".
 */
export const useTabsStore2 = defineStore('browsertabs', () => {

  // browser's current windows tabs, reloaded on various events
  const browserTabs= ref<chrome.tabs.Tab[]>([])

  // *** actions ***

  /**
   * initialize store with
   * @param ps a persistence storage
   */
  async function initialize() {
    console.debug(" ...initializing tabsStore2")
    // storage = ps
    // await storage.init()
    // // TODO remove after version 0.4.12
    // await storage.migrate()
    // await storage.loadTabsets()
    if ("bex" === process.env.MODE) {
      // --- own tab id ---
      // const ownTab = await ChromeApi.getCurrentTab()
      // if (ownTab && ownTab.id) {
      //   //console.log("setting extension tab id to ", ownTab.id)
      //   this.ownTabId = ownTab.id
      // }

      // --- setting current tabs
      browserTabs.value = await queryTabs()
    }
  }

  async function loadTabs (eventName: string) {
    browserTabs.value = await queryTabs()
    // const current = new Tabset("current", "current",
    //   _.map(browserTabs.value, t => {
    //     return new Tab(uid(), t)
    //   }))
    //markDuplicates(current)
    //this.browserTabset = current
  }

  // *** getters ***
  const tabsCount = computed(() => {
    return browserTabs.value.length
  })

  const getChromeTabs = computed(() => {
    return browserTabs.value
  })

  return {
    initialize,
    browserTabs,
    tabsCount,
    getChromeTabs
  }
})
