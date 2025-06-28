import {defineStore} from 'pinia';
import {computed, ref, watch, watchEffect} from "vue";

async function queryTabs(): Promise<chrome.tabs.Tab[]> {
  // @ts-ignore
  return await chrome.tabs.query({currentWindow: true});
}

/**
 * a pinia store for "browsertabs".
 */
export const useTabsStore = defineStore('browsertabs', () => {

  const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)

  // const onTabUpdatedListener = async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
  //   if (changeInfo.status === 'complete') {
  //     console.log("tab updated", tabId, changeInfo)
  //     currentChromeTab.value = await chrome.tabs.get(tabId)
  //   }
  // }

  const onTabActivatedListener = async (activeInfo: chrome.tabs.TabActiveInfo) => {
    const res = await chrome.tabs.query({currentWindow: true, active: true})
    if (res && res.length === 1) {
      console.log("tab active", res[0].url)
      currentChromeTab.value = res[0]
    }
  }

  async function initialize() {
    console.debug(" ...initializing tabsStore")
    initListeners()
  }

  function setCurrentChromeTab(tab: chrome.tabs.Tab) {
    currentChromeTab.value = tab
  }

  function initListeners() {
    console.debug(" ...initializing tabsStore Listeners")
    //chrome.tabs.onUpdated.addListener(onTabUpdatedListener)
    chrome.tabs.onActivated.addListener(onTabActivatedListener)
  }

  async function resetListeners() {
    //chrome.tabs.onUpdated.removeListener(onTabUpdatedListener)
    chrome.tabs.onActivated.removeListener(onTabActivatedListener)
  }

  return {
    initialize,
    setCurrentChromeTab,
    currentChromeTab
  }
})
