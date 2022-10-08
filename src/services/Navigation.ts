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


  closeTab(tab: Tab) {
    const tabsStore = useTabsStore()

    // if (tabsStore.isLiveMode) {
    //   console.log("closing tab (live mode)", tab.id)
    //   ChromeApi.tabsForUrl(tab.chromeTab.url)
    //     .then(res => {
    //       const length = res.length
    //       let counter = 0
    //       res.forEach(r => {
    //         const tabId = r.id
    //         counter += 1
    //         if (counter < length) {
    //           chrome.tabs.remove(tabId)
    //             // @ts-ignore
    //             .then(res2 => {
    //               tabsStore.removeTab(tabId)
    //             })
    //         }
    //       })
    //     })
    //     .catch(ex => console.error("ex", ex))
    //
    //   if (tab.chromeTab?.id) {
    //     tabsStore.removeTab(tab.chromeTab.id)
    //   }
    // } else {
    console.log("closing tab", tab.id, tab.chromeTab?.id)

    TabsetService.removeThumbnailsFor(tab.chromeTab?.url || '')
      .then(res => console.log("deleting thumbnail for ", tab.chromeTab.url))
      .catch(err => console.log("error deleting thumbnail", err))

    TabsetService.removeContentFor(tab.chromeTab?.url || '')
      .then(res => console.log("deleting content for ", tab.chromeTab.url))
      .catch(err => console.log("error deleting content", err))

    if (tab.chromeTab?.id) {
      tabsStore.removeTab(tab.chromeTab.id)
      useNotificationsStore().unsetSelectedTab()
    }
    // }


  }
}

export default new Navigation();

