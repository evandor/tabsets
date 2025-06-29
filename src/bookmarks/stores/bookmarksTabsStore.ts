import { defineStore } from 'pinia'
import { useUtils } from 'src/core/services/Utils'
import { ref } from 'vue'

/**
 * a pinia store for "browsertabs".
 */
export const useBookmarksTabsStore = defineStore('bookmarksBrowsertabs', () => {
  const { addListenerOnce } = useUtils()

  const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)

  // const onTabUpdatedListener = async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
  //   if (changeInfo.status === 'complete') {
  //     console.log("tab updated", tabId, changeInfo)
  //     currentChromeTab.value = await chrome.tabs.get(tabId)
  //   }
  // }

  const onTabActivatedListener = async (activeInfo: chrome.tabs.TabActiveInfo) => {
    const res = await chrome.tabs.query({ currentWindow: true, active: true })
    if (res && res.length === 1) {
      console.log('tab active', res[0]!.url)
      currentChromeTab.value = res[0]
    }
  }

  async function initialize() {
    // console.debug(' ...initializing tabsStore')
    initListeners()
  }

  function setCurrentChromeTab(tab: chrome.tabs.Tab) {
    currentChromeTab.value = tab
  }

  function initListeners() {
    // console.debug(' ...initializing tabsStore Listeners')
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    addListenerOnce(chrome.tabs.onActivated, onTabActivatedListener)
  }

  return {
    initialize,
    setCurrentChromeTab,
    currentChromeTab,
  }
})
