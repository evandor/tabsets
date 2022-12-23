import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import TabsetService from "src/services/TabsetService";
import {useTabsStore} from "stores/tabsStore";
import {useNotificationsStore} from "stores/notificationsStore";
import {Tab} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";
import _ from "lodash"

class TabService {

  private persistenceService = IndexedDbPersistenceService

  updateThumbnail(url: string | undefined): Promise<void> {
    if (url) {
      return this.persistenceService.updateThumbnail(url)
    }
    console.log("could not update thumbnail")
    return Promise.resolve()
  }

  updateContent(url: string | undefined): Promise<object> {
    if (url) {
      return this.persistenceService.updateContent(url)
    }
    console.log("could not update thumbnail")
    return Promise.resolve({})
  }

  delete(tab: Tab): Promise<Tabset> {
    console.log("deleting tab", tab.id, tab.chromeTab?.id)
    const tabUrl = tab.chromeTab?.url || ''
    if (TabsetService.tabsetsFor(tabUrl).length <= 1) {
      TabsetService.removeThumbnailsFor(tabUrl)
        .then(() => console.log("deleting thumbnail for ", tabUrl))
        .catch(err => console.log("error deleting thumbnail", err))

      TabsetService.removeContentFor(tabUrl)
        .then(() => console.log("deleting content for ", tabUrl))
        .catch(err => console.log("error deleting content", err))
    }
    useNotificationsStore().unsetSelectedTab()
    return useTabsStore().removeTab(tab.id)

  }

  checkScheduled() {
    const tabs = useTabsStore().scheduledTabs
    const dueTabs: Tab[] = []
    const now = new Date().getTime()
    const selfId = localStorage.getItem("selfId")
    _.forEach(tabs, (t: Tab) => {
      console.log("comparing", t.scheduledFor, now, selfId)
      if (t.scheduledFor && t.scheduledFor <= now) {
        console.log("hir")
        dueTabs.push(t)
      }
    })
    if (dueTabs.length > 0) {
      chrome.notifications.create(
        dueTabs[0].id,
        {
          title: "Tabset Extension Message",
          type: "basic",
          iconUrl: "chrome-extension://" + selfId + "/www/favicon.ico",
          message: "scheduled tab is due",
          buttons: [
            {title: "open Tabsets Extension"}
          ]
        },
        (a) => {
          console.log("a", a)
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
