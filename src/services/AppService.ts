import {usePermissionsStore} from "stores/permissionsStore";
import ChromeListeners from "src/services/ChromeListeners";
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import BookmarksService from "src/services/BookmarksService";
import {useQuasar} from "quasar";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_NAME} from "boot/constants";
import {useNotificationsStore} from "stores/notificationsStore";
import {useDB} from "src/services/usePersistenceService";
import {useSuggestionsStore} from "stores/suggestionsStore";
import tabsetService from "src/services/TabsetService";
import {useTabsetService} from "src/services/TabsetService2";
import MHtmlService from "src/services/MHtmlService";
import ChromeApi from "src/services/ChromeApi";
import {useSpacesStore} from "stores/spacesStore";
import {useTabsStore} from "stores/tabsStore";
import {useSettingsStore} from "stores/settingsStore";
import {useBookmarksStore} from "stores/bookmarksStore";
import {useWindowsStore} from "stores/windowsStores";
import {useSearchStore} from "stores/searchStore";
import {useUiStore} from "stores/uiStore";
import {useRoute, useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";

const {inBexMode} = useUtils()

class AppService {


  async init() {

    const spacesStore = useSpacesStore()
    const tabsStore = useTabsStore()
    const settingsStore = useSettingsStore()
    const bookmarksStore = useBookmarksStore()
    const windowsStore = useWindowsStore()
    const searchStore = useSearchStore()
    const uiStore = useUiStore()
    const router = useRouter()
    const route = useRoute()
    const $q = useQuasar()

    // init of stores and some listeners
    usePermissionsStore().initialize()
      .then(() => {
        ChromeListeners.initListeners()
        ChromeBookmarkListeners.initListeners()
        bookmarksStore.init()
        BookmarksService.init()
      })
    settingsStore.initialize(useQuasar().localStorage);
    tabsStore.initialize(useQuasar().localStorage);

    searchStore.init()
    windowsStore.initialize(useDB(undefined).db)
    // TODO best place here?
    windowsStore.initListeners()

    const localStorage = useQuasar().localStorage

// init db
    IndexedDbPersistenceService.init(INDEX_DB_NAME)
      .then(() => {
        // init services
        useNotificationsStore().initialize(useDB(undefined).db)
        useSuggestionsStore().init(useDB(undefined).db)
        tabsetService.setLocalStorage(localStorage)
        spacesStore.initialize(useDB(undefined).db)
          .then(() => {
            useTabsetService().init(false)
              .then(() => {
                MHtmlService.init()
                ChromeApi.init()
                // @ts-ignore
                if (tabsStore.tabsets.size === 0 && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
                  router.push("/sidepanel/welcome")
                }
              })
          })
      })


    useNotificationsStore().bookmarksExpanded = $q.localStorage.getItem("bookmarks.expanded") || []

// @ts-ignore
    if (!inBexMode() || (!chrome.sidePanel && chrome.action)) {
      router.push("/start")
    }


  }

}

export default new AppService();

