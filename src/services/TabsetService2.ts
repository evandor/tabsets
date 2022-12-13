import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import {uid} from "quasar";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useSearchStore} from "stores/searchStore";
import TabsetService from "src/services/TabsetService";
import {usePersistenceService} from "src/services/usePersistenceService";

export function useTabsetService(logger: any) {

  const persistenceService = usePersistenceService()

  /**
   * Will create a new tabset (or update an existing one with matching name) from
   * the provided Chrome tabs.
   *
   * Use case: https://skysail.atlassian.net/wiki/spaces/TAB/pages/807927852/Creating+a+Tabset
   *
   * The tabset is created or updated in the store, and the new data is persisted.
   * If merge is false, potentially existing tabs will be removed first.
   *
   * @param name the tabset's name
   * @param chromeTabs an array of Chrome tabs
   * @param merge if true, the old values (if existent) and the new ones will be merged.
   */
  const saveOrReplaceFromChromeTabs = async (name: string, chromeTabs: chrome.tabs.Tab[], merge: boolean = false): Promise<object> => {
    logger.info("persistenceService", persistenceService)
    const trustedName = name.replace(STRIP_CHARS_IN_USER_INPUT, '')
    const tabsStore = useTabsStore()
    const tabs: Tab[] = _.map(chromeTabs, t => new Tab(uid(), t))
    try {
      const result: NewOrReplacedTabset = await tabsStore.updateOrCreateTabset(trustedName, tabs, merge)
      if (result && result.tabset) {
        await TabsetService.saveTabset(result.tabset)
        TabsetService.selectTabset(result.tabset.id)
        useSearchStore().indexTabs(result.tabset.id, tabs)
      }
      return {
        replaced: result.replaced,
        tabsetId: result.tabset.id,
        merged: merge
      }
    } catch (err) {
      return Promise.reject("problem updating or creating tabset: " + err)
    }
  }

  return {
    saveOrReplaceFromChromeTabs
  }

}
