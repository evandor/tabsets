import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {useDB} from "src/services/usePersistenceService";

const {localDb} = useDB()

class TabService {

  updateThumbnail(url: string | undefined): Promise<void> {
    if (url) {
      return localDb.updateThumbnail(url)
    }
    console.log("could not update thumbnail")
    return Promise.resolve()
  }

  updateContent(url: string | undefined): Promise<object> {
    if (url) {
      return localDb.updateContent(url)
    }
    console.log("could not update thumbnail")
    return Promise.resolve({})
  }



  checkScheduled() {
    const tabs = useTabsStore().scheduledTabs
    const dueTabs: Tab[] = []
    const now = new Date().getTime()
    _.forEach(tabs, (t: Tab) => {
      if (t.scheduledFor && t.scheduledFor <= now) {
        dueTabs.push(t)
      }
    })
    if (dueTabs.length > 0) {
      chrome.notifications.create(
        dueTabs[0].id,
        {
          title: "Tabset Extension Message",
          type: "basic",
          //iconUrl: "chrome-extension://" + selfId + "/www/favicon.ico",
          iconUrl: chrome.runtime.getURL("www/favicon.ico"),
          message: "scheduled tab is due",
          buttons: [
            {title: "open Tabsets Extension"}
          ]
        },
        (a) => {
          //console.log("a", a)
          /*chrome.tabs.query({title: `Tabsets Extension`}, (result: chrome.tabs.Tab[]) => {
            if (result && result.length > 0) {
              const tab = result[0]
              if (tab.id) {
                chrome.tabs.update(tab.id, {active: true})
              }
            }
          })*/
        }
      )
    }
  }
}

export default new TabService()
