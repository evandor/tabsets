import {Tab} from "src/models/Tab";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {openURL} from "quasar";
import {useTabsetService} from "src/services/TabsetService2";
import {useTabsStore} from "src/stores/tabsStore";

class NavigationService {

  openOrCreateTab(withUrl: string) {
    console.log("opening", withUrl)
    if (process.env.MODE === "bex") {
      // get all tabs with this url
      const tabsForUrl = useTabsStore().tabsForUrl(withUrl) || []
      const selections: string[] = []
      tabsForUrl.forEach(t => {
        if (t.selection) {
          selections.push(t.selection)
        }
      })

      chrome.tabs.query({currentWindow: true}, (t: chrome.tabs.Tab[]) => {
        let found = false;
        t.filter(r => r.url && !r.url.startsWith("chrome"))
          .map(r => {
            if (withUrl === r.url) {
              if (!found) { // highlight only first hit
                found = true
                chrome.tabs.highlight({tabs: r.index});
                console.log("sending Message highlightSelections")
                chrome.runtime.sendMessage({
                  msg: "highlightSelections",
                  selections: selections
                }, (res: any) => {
                  //console.log("got response1", res)
                })
              }
            }
          });
        if (!found) {
          console.log("tab not found, creating new one")
          chrome.tabs.create({
            active: true,
            pinned: false,
            url: withUrl
          }, (tab:chrome.tabs.Tab) => {
            // pass selections and execute quoting script
            if (selections.length > 0) {
              console.log("selections", selections)
              // @ts-ignore
              chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: ['highlighting.js']
              }, (result: any) => {
                console.log("sending Message highlightSelections", tab.id)
                if (tab.id) {
                  chrome.tabs.sendMessage(tab.id, {
                    msg: "highlightSelections",
                    selections: selections
                  }, (res: any) => {
                    //console.log("got response2", res)
                  })
                }
              });
            }
          })
        }
      })
    } else {
      openURL(withUrl)//, undefined, {target: "_ts"}) - does not work
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
      try {
        chrome.tabs.remove(tab.chromeTab.id)
      } catch (err) {
        console.log("error clsosing chrome tab", err)
      }
    }
  }

  updateAvailable(details: any) {
    console.log("details: UpdateAvailableDetails", details)
    useNotificationsStore().updateAvailable(true, details.version)
  }
}

export default new NavigationService();

