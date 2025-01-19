import { useUtils } from 'src/core/services/Utils'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useWindowsStore } from 'src/windows/stores/windowsStore'

const { inBexMode } = useUtils()

class TabService {
  isCurrentTab = (tab: Tab) => {
    if (!inBexMode() || !tab.url) {
      return false
    }
    const windowId = useWindowsStore().currentBrowserWindow?.id || 0
    const currentChromeTab: chrome.tabs.Tab | undefined =
      useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
    // console.log("checking current tab", currentChromeTab, tab.url, currentChromeTab.url === tab.url)

    // special urls
    // if (currentChromeTab?.url === "https://excalidraw.com/" && useContentStore().currentLocalStorage) {
    //   return tab.id === useContentStore().currentLocalStorage['tabsetsTabId']
    // }

    if (currentChromeTab?.url === tab.url) {
      tab.chromeTabId = currentChromeTab.id
      return true
    }
    //console.log("checking", currentChromeTab.url, "/" + btoa(tab.url || ''), currentChromeTab.url?.indexOf("/" + btoa(tab.url || '')) )
    if (currentChromeTab?.url && currentChromeTab.url?.indexOf('/' + btoa(tab.url || '')) >= 0) {
      return true
    }
    return false
  }
}

export default new TabService()
