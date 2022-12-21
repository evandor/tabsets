import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import TabsetService from "src/services/TabsetService";
import {useTabsStore} from "stores/tabsStore";
import {useNotificationsStore} from "stores/notificationsStore";
import {Tab} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";

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
}

export default new TabService()
