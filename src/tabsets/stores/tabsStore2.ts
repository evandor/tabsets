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
  const browserTabs = ref<chrome.tabs.Tab[]>([])

  const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)

  // tab by window id
  const currentChromeTabs = ref<Map<number, chrome.tabs.Tab>>(new Map())

  // the ids of the tabs the user activated, limited to the last X entries
  // const chromeTabsHistory = new Array<[number, string]>()
  const chromeTabsHistory =ref<[number, string][]>([]) //new Array<[number, string]>()

  // where are we in the chromeTabsHistory?
  const chromeTabsHistoryPosition = ref(-1)

  // we are currently navigating through the history?
  const chromeTabsHistoryNavigating = ref(false)

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

  async function loadTabs(eventName: string) {
    browserTabs.value = await queryTabs()
    // const current = new Tabset("current", "current",
    //   _.map(browserTabs.value, t => {
    //     return new Tab(uid(), t)
    //   }))
    //markDuplicates(current)
    //this.browserTabset = current
  }

  function setCurrentChromeTab(tab: chrome.tabs.Tab) {
    currentChromeTab.value = tab
    currentChromeTabs.value.set(tab.windowId, tab)
    const MAX_HISTORY_LENGTH = 12

    // tab was activated without using the navigation
    if (tab.id && !chromeTabsHistoryNavigating.value) {

      // update urls for matching id
      chromeTabsHistory.value.forEach(([tabId, url], index) => {
        if (tabId === tab.id) {
          chromeTabsHistory.value[index] = [tabId, tab.url || '']
        }
      });

      const historyLength = chromeTabsHistory.value.length
      chromeTabsHistoryPosition.value = Math.min(MAX_HISTORY_LENGTH - 1, historyLength)
      if (historyLength > 0 &&
        chromeTabsHistory.value[historyLength - 1][0] !== tab.id &&
        chromeTabsHistory.value[historyLength - 1][1] !== tab.url
      ) {
        chromeTabsHistory.value.push([tab.id, tab.url || ''])
      } else if (historyLength === 0) {
        chromeTabsHistory.value.push([tab.id, tab.url || ''])
      } else {
        //console.log("did not add, adjusting position", historyLength - 1)
        chromeTabsHistoryPosition.value = historyLength - 1
      }
      if (chromeTabsHistory.value.length > MAX_HISTORY_LENGTH) {
        // console.log("deleting first element")
        chromeTabsHistory.value.splice(0, 1)
      }
    } else if (chromeTabsHistoryNavigating.value) {
      chromeTabsHistoryNavigating.value = false
    }
  }

  function tabHistoryBack() {
    if (chromeTabsHistoryPosition.value > 0) {
      console.log("called tabHistoryBack with", chromeTabsHistoryPosition.value)
      chromeTabsHistoryPosition.value -= 1
      chromeTabsHistoryNavigating.value = true
    }
    return chromeTabsHistory.value[chromeTabsHistoryPosition.value]
  }

  function tabHistoryForward() {
    if (chromeTabsHistoryPosition.value < chromeTabsHistory.value.length - 1) {
      console.log("called tabHistoryForward with", chromeTabsHistoryPosition.value, chromeTabsHistory.value.length)
      chromeTabsHistoryPosition.value += 1
      chromeTabsHistoryNavigating.value = true
    }
    return chromeTabsHistory.value[chromeTabsHistoryPosition.value]
  }

  function removeTab(tabset: Tabset, tabId: string) {
    tabset.tabs = _.filter(tabset.tabs as Tab[], (t: Tab) => t.id !== tabId)
    // markDuplicates(tabset)
    // if (this.pendingTabset) {
    //   this.pendingTabset.tabs = _.filter(this.pendingTabset.tabs as Tab[], (t: Tab) => t.id !== tabId)
    // }
    for (const folder of tabset.folders || []) {
      removeTab(folder, tabId)
    }
  }


  // *** getters ***
  const tabsCount = computed(() => {
    return browserTabs.value.length
  })

  // TODO needed?
  const getChromeTabs = computed(() => {
    return browserTabs.value
  })

  const getCurrentChromeTab = computed(() => {
    return (windowId: number): chrome.tabs.Tab | undefined => {
      return currentChromeTabs.value.get(windowId)
    }
  })



  return {
    initialize,
    browserTabs,
    tabsCount,
    loadTabs,
    getChromeTabs,
    setCurrentChromeTab,
    getCurrentChromeTab,
    currentChromeTab,
    tabHistoryBack,
    tabHistoryForward,
    chromeTabsHistoryNavigating,
    chromeTabsHistoryPosition,
    chromeTabsHistory,
    removeTab
  }
})
