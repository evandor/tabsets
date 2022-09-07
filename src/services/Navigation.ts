import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";

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
      console.log("found", found)
      if (!found) {
        chrome.tabs.create({
          active: false,
          pinned: false,
          url: withUrl
        })
          .catch(e => {
            console.log("got error", e)
          })
      }
    });

  }


  closeTab(tab: Tab) {
    const tabsStore = useTabsStore()

    if (tabsStore.isContextMode) {
      console.log("closing tab", tab.id)
      // chrome.tabs.query({url: tab.chromeTab.url})
      //   .then(res => {
      //     res.forEach(r => {
      //       if (r.id) {
      //         const tabId = r.id
      //         chrome.tabs.remove(tabId)
      //           .then(res2 => tabsStore.removeTab(tabId))
      //           .catch(ex => console.error("ex", ex))
      //       }
      //     })
      //   })
      if (tab.chromeTab?.id) {
        tabsStore.removeTab(tab.chromeTab.id)
      }
    } else if (tabsStore.isLiveMode) {
      console.log("closing tab (live mode)", tab.id)
      chrome.tabs.query({url: tab.chromeTab.url})
        .then(res => {
          res.forEach(r => {
            if (r.id) {
              const tabId = r.id
              chrome.tabs.remove(tabId)
                .then(res2 => tabsStore.removeTab(tabId))
                .catch(ex => console.error("ex", ex))
            }
          })
        })
      if (tab.chromeTab?.id) {
        tabsStore.removeTab(tab.chromeTab.id)
      }
    } else {
      console.log("closing tab (edit mode)", tab.id)
      if (tab.chromeTab?.id) {
        tabsStore.removeTab(tab.chromeTab.id)
      }
    }

    if ("current" === tabsStore.currentTabsetId) {
      // console.log("closing tab with id", tab.id)
      //
      // if (tab.chromeTab) {
      //   const tabId = tab.chromeTab.id
      //   chrome.tabs.remove(tabId)
      //     .then(res => tabsStore.removeTab(tabId))
      //     .catch(ex => console.error("ex", ex))
      // }
    } else {

    }
  }
}

export default new Navigation();

