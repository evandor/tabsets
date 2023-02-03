import {Tab} from "src/models/Tab";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {openURL} from "quasar";

class NavigationService {

  openOrCreateTab(withUrl: string) {
    if (process.env.MODE === "bex") {
      chrome.tabs.query({currentWindow: true}, (t: chrome.tabs.Tab[]) => {
        let found = false;
        t.filter(r => r.url && !r.url.startsWith("chrome"))
          .map(r => {
            if (withUrl === r.url) {
              if (!found) { // highlight only first hit
                found = true
                chrome.tabs.highlight({tabs: r.index});
              }
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
      })
    } else {
      openURL(withUrl)
    }
  }

  openTab(tabId: number) {
    chrome.tabs.update(tabId, {active: true})
  }

  muteAll() {
    chrome.tabs.query({audible: true}, (tabs: chrome.tabs.Tab[]) => {
      tabs.forEach((t: chrome.tabs.Tab) => {
        if (t && t.id) {
          chrome.tabs.update(t.id, {muted: true})
        }
      })
    })
  }


  closeChromeTab(tab: Tab) {
    console.log("closing chrome tab", tab.id, tab.chromeTab?.id)
    if (tab.chromeTab?.id) {
      chrome.tabs.remove(tab.chromeTab.id)
    }
  }

  updateAvailable(details: any) {
    console.log("details: UpdateAvailableDetails", details)
    useNotificationsStore().updateAvailable(true, details.version)
  }
}

export default new NavigationService();

