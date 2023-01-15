import {useTabsStore} from "stores/tabsStore";
import {useBookmarksStore} from "stores/bookmarksStore";
import _ from "lodash"
import {StatsEntry} from "src/models/StatsEntry";
import {useDB} from "src/services/usePersistenceService";

const {localDb} = useDB()

class StatsService {

  count() {
    const tabsStore = useTabsStore()
    const bookmarsStore = useBookmarksStore()

    const tabssetsSize = tabsStore.tabsets.size
    const openTabsCount = tabsStore.tabsCount
    const tabsCount = tabsStore.allTabsCount
    const bookmarksCount = _.filter(bookmarsStore.bookmarksLeaves, (b:object) => Object.hasOwn(b, 'url')).length

    navigator.storage.estimate()
      .then((res) => {
        const offset = new Date().getTimezoneOffset()
        const todayLong = new Date(new Date().getTime() - (offset * 60 * 1000))
        const today = todayLong.toISOString().split('T')[0]
        const dataset = new StatsEntry(today, tabssetsSize, openTabsCount, tabsCount, bookmarksCount, res.usage || 0)
        localDb.saveStats(today, dataset)
      })
  }
}

export default new StatsService();
