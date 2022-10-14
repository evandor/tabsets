import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import ChromeApi from "src/services/ChromeApi";
import {useNotificationsStore} from "stores/notificationsStore";
import TabsetService from "src/services/TabsetService";

class Navigation {

  openOrCreateTab(withUrl: string) {
    console.log("hier", withUrl)

    chrome.tabs.query({currentWindow: true}, (t: chrome.tabs.Tab[]) => {
      let found = false;
      t.filter(r => r.url && !r.url.startsWith("chrome"))
        .map(r => {
          if (withUrl === r.url) {
            found = true
            chrome.tabs.highlight({tabs: r.index});
          }
        });
      if (!found) {

        chrome.tabs.create({
          active: true,
          pinned: false,
          url: withUrl
        })// @ts-ignore
          .catch(e => {
            console.log("got error", e)
          })
      }
    });

  }

  /**
   * https://skysail.atlassian.net/wiki/spaces/TAB/pages/800849921/Tab+Handling
   *
   * TODO move to TabsetService?
   *
   * @param tab to deal with
   */
  closeTab(tab: Tab) {
    console.log("closing tab", tab.id, tab.chromeTab?.id)
    const tabUrl = tab.chromeTab?.url || ''
    if (TabsetService.tabsetsFor(tabUrl).length <= 1) {
      TabsetService.removeThumbnailsFor(tabUrl)
        .then(res => console.log("deleting thumbnail for ", tabUrl))
        .catch(err => console.log("error deleting thumbnail", err))

      TabsetService.removeContentFor(tabUrl)
        .then(res => console.log("deleting content for ", tabUrl))
        .catch(err => console.log("error deleting content", err))
    }
    useTabsStore().removeTab(tab.id)
    useNotificationsStore().unsetSelectedTab()
  }

  closeChromeTab(tab: Tab) {
    const tabsStore = useTabsStore()
    console.log("closing chrome tab", tab.id, tab.chromeTab?.id)
    if (tab.chromeTab?.id) {
      chrome.tabs.remove(tab.chromeTab.id)
    }
  }
}

export default new Navigation();

