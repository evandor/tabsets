import {useTabsStore} from "stores/tabsStore";

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


  closeTab(tab: chrome.tabs.Tab) {
    const tabsStore = useTabsStore()
    //console.log("tabsStore", this.tabsStore)
    if ("current" === tabsStore.currentTabsetId) {
      console.log("closing tab with id", tab.id)

      if (tab.id) {
        const tabId = tab.id
        chrome.tabs.remove(tabId)
          .then(res => tabsStore.removeTab(tabId))
          .catch(ex => console.error("ex", ex))
      }
    } else {
      console.log("removing tab", tab.id)
      chrome.tabs.query({url: tab.url})
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
      if (tab.id) {
        tabsStore.removeTab(tab.id)
      }
    }
  }
}

export default new Navigation();

