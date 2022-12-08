import {useTabsStore} from "stores/tabsStore";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useBookmarksStore} from "stores/bookmarksStore";
import _ from "lodash"

class StatsService {

  private persistenceService = IndexedDbPersistenceService

  count() {
    const tabsStore = useTabsStore()
    const bookmarsStore = useBookmarksStore()

    const tabssetsSize = tabsStore.tabsets.size
    const openTabsCount = tabsStore.tabsCount
    const tabsCount = tabsStore.allTabsCount
    const bookmarksCount = _.filter(bookmarsStore.bookmarksLeaves, (b:object) => Object.hasOwn(b, 'url')).length

    const dataset = {
      tabsets: tabssetsSize,
      openTabsCount: openTabsCount,
      tabsCount: tabsCount,
      bookmarksCount: bookmarksCount
    }
    this.persistenceService.saveStats(dataset)
  }
}

export default new StatsService();
