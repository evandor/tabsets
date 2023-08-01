import {HTMLSelection, Tab} from "src/models/Tab";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {openURL, useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";

class NavigationService {

  openOrCreateTab(withUrl: string) {
    console.log("opening", withUrl)
    if (process.env.MODE === "bex") {
      // get all tabs with this url
      const tabsForUrl = useTabsStore().tabsForUrl(withUrl) || []
      const selections: HTMLSelection[] = []
      const annotations: any[] = []
      tabsForUrl.forEach(t => {
        if (t.selections) {
          console.log("found", t.selections)
          t.selections.forEach(s => selections.push(s))
          //selections.concat(t.selections)
        }
        if (t.annotations) {
          console.log("found", t.annotations)
          t.annotations.forEach(s => annotations.push(s))
        }
        if (t.httpInfo) {
          t.httpError = ''
          t.httpInfo = ''

          const ts = useTabsStore().tabsetFor(t.id)
          if (ts) {
            console.log("saving tabset ", ts)
            useTabsetService().saveTabset(ts)
          }
        }
      })

      console.log("selections are", selections)

      chrome.tabs.query({}, (t: chrome.tabs.Tab[]) => {
        let found = false;
        t.filter(r => r.url)
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
          }, (tab: chrome.tabs.Tab) => {
            // pass selections and execute quoting script
            if (selections.length > 0) {
              console.log("selections", selections, tab.id)
              // @ts-ignore
              chrome.scripting.executeScript({
                target: {tabId: tab.id || 0},
                files: ['highlighting.js']
              }, (result: any) => {
                if (tab.id) {
                  console.log("sending Message highlightSelections", tab.id)
                  chrome.tabs.sendMessage(tab.id, {
                    msg: "highlightSelections",
                    selections: selections
                  }, (res: any) => {
                    //console.log("got response2", res)
                  })
                }
              });
            }

            //if (annotations.length > 0) {
              console.log("annotations!!!", annotations, tab.id)
chrome.tabs.sendMessage(tab.id || 0, "hi")
              useQuasar().bex.send('wb.drawer.toggle', {
                annotations: {}
              })
            chrome.runtime.sendMessage({msg: "tabsets.annotations", data: {}})

              // @ts-ignore
              // chrome.scripting.executeScript({
              //   target: {tabId: tab.id || 0},
              //   files: ['recogito2.js']
              // }, (result: any) => {
              //   if (tab.id) {
              //     console.log("sending Message sendAnnotations", tab.id)
              //     chrome.tabs.sendMessage(tab.id, {
              //       msg: "sendAnnotations",
              //       annotations: annotations
              //     }, (res: any) => {
              //       //console.log("got response2", res)
              //     })
              //   }
              // });
          //  }

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
    console.log("closing chrome tab", tab.id, tab?.id)
    if (tab?.id) {
      try {
        chrome.tabs.remove(tab.chromeTabId || 0)
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

