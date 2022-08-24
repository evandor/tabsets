import {useTabsStore} from "stores/tabsStore";
import {LocalStorage} from "quasar";
import {Tabset} from "src/models/Tabset";

class ChromeApi {

  // tabsStore = useTabsStore()

  async closeAllTabs() {
    chrome.tabs.query({currentWindow: true}, (t: chrome.tabs.Tab[]) => {
      // @ts-ignore
      const ids: number[] = t.filter((r: chrome.tabs.Tab) => !r.url.startsWith('chrome'))
        .filter(r => r.id !== undefined)
        .map(r => r.id || 0);
      console.log("ids to close", ids)
      chrome.tabs.remove(ids)
    });
  }

  getTabs() {
    return [];
  }

  restore(tabset: Tabset) {
    console.log("restoring tabset ", tabset)
    chrome.tabs.query({currentWindow: true}, (t: chrome.tabs.Tab[]) => {
      // @ts-ignore
      console.log("callback", t)
      // @ts-ignore
      const ids: number[] = t.filter((r: chrome.tabs.Tab) => !r.url.startsWith('chrome'))
        .filter(r => r.id !== undefined)
        .map(r => r.id || 0);
      console.log("ids to close", ids)
      chrome.tabs.remove(ids)
      tabset.tabs.forEach(t => {
        console.log("creating tab", t)
        chrome.tabs.create({
          active: false,
          index: t.chromeTab.index,
          pinned: t.chromeTab.pinned,
          url: t.chromeTab.url
        })
          .catch(e => {
            console.log("got error", e)
          })
      });
    });
  }
}

export default new ChromeApi();

