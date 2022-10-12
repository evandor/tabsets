import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import ChromeApi from "src/services/ChromeApi";
import {useNotificationsStore} from "stores/notificationsStore";
import TabsetService from "src/services/TabsetService";

class Navigation {

  openOrCreateTab(tab: Tab) {
    console.log("hier", tab.chromeTab?.url)
    const withUrl = tab.chromeTab?.url
    const refs = tab.references

    chrome.tabs.query({currentWindow: true}, (t: chrome.tabs.Tab[]) => {
      let found = false;
      t.filter(r => r.url && !r.url.startsWith("chrome"))
        .map(r => {
          if (withUrl === r.url) {
            found = true
            chrome.tabs.highlight({tabs: r.index});
            console.log("trying to highlight...")
            // @ts-ignore
            chrome.scripting.executeScript({
              target: {tabId: r.id, allFrames: true},
              args: [refs],
              func: (refs: object) => {

                const keys = Object.keys(refs)
                console.log("keys", keys)

                keys.forEach(key => {
                  console.log("key", key)
                  const xpathResult = document.evaluate(key, document.documentElement, null, XPathResult.ANY_TYPE, null);
                  console.log("xxx", xpathResult)
                  if (xpathResult.resultType === 4) { //UNORDERED_NODE_ITERATOR_TYPE)
                    var node = xpathResult.iterateNext();
                    if (node != null) {
                      console.log("xxx1", node)
                      var range = document.createRange();
                      range.selectNodeContents(node);
                      var span = document.createElement('span');
                      span.className = 'highlight';
                      range.surroundContents(span);
                    }
                  } else {
                    var node = xpathResult.singleNodeValue;
                    if (node != null) {
                      console.log("xxx2", node)

                      var range = document.createRange();
                      range.selectNodeContents(node);
                      var span = document.createElement('span');
                      span.className = 'highlight';
                      range.surroundContents(span);
                    }
                  }
                })


              }
            })


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

