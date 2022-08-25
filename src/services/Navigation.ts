import {useTabsStore} from "stores/tabsStore";

class Navigation {

  tabsStore = useTabsStore()

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


  closeTab(tabId: number) {
    //console.log("tabsStore", this.tabsStore)
    if ("current" === this.tabsStore.currentTabsetId) {
      console.log("closing tab with id", tabId)
      chrome.tabs.remove(tabId)
        .then(res => this.tabsStore.removeTab(tabId))
        .catch(ex => console.error("ex", ex))
    } else {
      console.log("removing tab", tabId)
      this.tabsStore.removeTab(tabId)
    }
  }
}

export default new Navigation();

