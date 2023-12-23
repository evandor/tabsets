import {usePermissionsStore} from "stores/permissionsStore";
import ChromeListeners from "src/services/ChromeListeners";
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import BookmarksService from "src/services/BookmarksService";
import {useQuasar} from "quasar";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
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
import {useWindowsStore} from "src/stores/windowsStore";
import {useSearchStore} from "stores/searchStore";
import {useRouter} from "vue-router";
import {useGroupsStore} from "stores/groupsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useMessagesStore} from "src/stores/messagesStore";
import {SyncType, useAppStore} from "stores/appStore";
import GitPersistentService from "src/services/persistence/GitPersistentService";

class AppService {

  async init() {

    const appStore = useAppStore()
    const spacesStore = useSpacesStore()
    const tabsStore = useTabsStore()
    const settingsStore = useSettingsStore()
    const bookmarksStore = useBookmarksStore()
    const windowsStore = useWindowsStore()
    const messagesStore = useMessagesStore()
    const groupsStore = useGroupsStore()
    const searchStore = useSearchStore()
    const router = useRouter()
    const $q = useQuasar()

    appStore.init()
    //MqttService.init()

    // init of stores and some listeners
    usePermissionsStore().initialize(useDB(useQuasar()).localDb)
      .then(() => {
        ChromeListeners.initListeners()
        ChromeBookmarkListeners.initListeners()
        bookmarksStore.init()
        BookmarksService.init()
      })
    settingsStore.initialize(useQuasar().localStorage);
    tabsStore.initialize(useQuasar().localStorage);

    searchStore.init()

    const localStorage = useQuasar().localStorage

    // sync features
    const syncType = localStorage.getItem("sync.type") as SyncType || SyncType.NONE
    const syncUrl = localStorage.getItem("sync.git.url") as string | undefined
    const dbOrGitDb = syncType && syncType === SyncType.GIT && syncUrl ? useDB(undefined).gitDb : useDB(undefined).db
    console.log("checking sync config:", syncType, syncUrl, dbOrGitDb)

// init db
    IndexedDbPersistenceService.init("db")
      .then(() => {

        if (syncType && syncType === SyncType.GIT && syncUrl) {
          GitPersistentService.init(syncUrl)
        }

        // init services
        useNotificationsStore().initialize(useDB(undefined).db)
        useSuggestionsStore().init(useDB(undefined).db)
        messagesStore.initialize(useDB(undefined).db)

        tabsetService.setLocalStorage(localStorage)
        spacesStore.initialize(dbOrGitDb)
          .then(() => {
            useTabsetService().init(dbOrGitDb, false)
              .then(() => {
                MHtmlService.init()
                ChromeApi.init(router)

                if (usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS)) {
                  groupsStore.initialize(useDB(undefined).db)
                  groupsStore.initListeners()
                }

                windowsStore.initialize(useDB(undefined).db)
                windowsStore.initListeners()

                // tabsets not in bex mode means running on "shared.tabsets.net"
                // probably running an import ("/imp/:sharedId")
                // we do not want to go to the welcome back
                if (tabsStore.tabsets.size === 0 && $q.platform.is.bex) {
                  router.push("/sidepanel/welcome")
                }
              })
          })
      })


    useNotificationsStore().bookmarksExpanded = $q.localStorage.getItem("bookmarks.expanded") || []

    // @ts-ignore
    // if (!inBexMode() || (!chrome.sidePanel && chrome.action)) {
    //   router.push("/start")
    // }


  }

}

export default new AppService();

