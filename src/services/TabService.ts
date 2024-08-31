import {Tab} from "src/tabsets/models/Tab";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {useUtils} from "src/core/services/Utils";

const {inBexMode} = useUtils()

class TabService {

  isCurrentTab = (tab: Tab) => {
    if (!inBexMode() || !tab.url) {
      return false
    }
    const windowId = useWindowsStore().currentChromeWindow?.id || 0
    const currentChromeTab = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
    //console.log("checking current tab", currentChromeTab.url, tab.url, currentChromeTab.url === tab.url)
    if (currentChromeTab?.url === tab.url) {
      tab.chromeTabId = currentChromeTab.id
      return true
    }
    //console.log("checking", currentChromeTab.url, "/" + btoa(tab.url || ''), currentChromeTab.url?.indexOf("/" + btoa(tab.url || '')) )
    if (currentChromeTab?.url && currentChromeTab.url?.indexOf("/" + btoa(tab.url || '')) >= 0) {
      return true
    }
    return false
  }


}

export default new TabService()
