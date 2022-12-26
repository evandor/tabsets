import {useTabsStore} from "stores/tabsStore";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useBookmarksStore} from "stores/bookmarksStore";
import _ from "lodash"
import {StatsEntry} from "src/models/StatsEntry";

class StatsService {

  private persistenceService = IndexedDbPersistenceService

  count() {
    const tabsStore = useTabsStore()
    const bookmarsStore = useBookmarksStore()

    const tabssetsSize = tabsStore.tabsets.size
    const openTabsCount = tabsStore.tabsCount
    const tabsCount = tabsStore.allTabsCount
    const bookmarksCount = _.filter(bookmarsStore.bookmarksLeaves, (b:object) => Object.hasOwn(b, 'url')).length

    navigator.storage.estimate()
      .then((res) => {
        const dataset = new StatsEntry(tabssetsSize, openTabsCount, tabsCount, bookmarksCount, res.usage || 0)
        this.persistenceService.saveStats(dataset)
      })
  }
}

export default new StatsService();
