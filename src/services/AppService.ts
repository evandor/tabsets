import {usePermissionsStore} from "stores/permissionsStore";
import ChromeListeners from "src/services/ChromeListeners";
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import BookmarksService from "src/services/BookmarksService";
import {LocalStorage} from "quasar";
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
import {Router} from "vue-router";
import {useGroupsStore} from "stores/groupsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useMessagesStore} from "src/stores/messagesStore";
import {SyncType, useAppStore} from "stores/appStore";
import GitPersistentService from "src/services/persistence/GitPersistentService";
import {SYNC_GITHUB_URL, SYNC_TYPE} from "boot/constants";
import {useAuthStore} from "stores/authStore";
import PersistenceService from "src/services/PersistenceService";
import {useUiStore} from "stores/uiStore";
import {User} from "firebase/auth";
import {Account} from "src/models/Account";

function useGitStore(st: SyncType, su: string | undefined) {
  const isAuthenticated = useAuthStore().isAuthenticated()
  console.debug("%cisAuthenticated", "font-weight:bold", isAuthenticated)
  return isAuthenticated && st && (st === SyncType.GITHUB || st === SyncType.MANAGED_GIT) && su
}

class AppService {

  router: Router = null as unknown as Router
  initialized = false

  async init(quasar: any, router: Router, forceRestart = false, user: User | undefined = undefined, account: Account | undefined = undefined) {

    console.log(`%cinitializing AppService: first start=${!this.initialized}, forceRestart=${forceRestart}, quasar set=${quasar !== undefined}, router set=${router !== undefined}`, "font-weight:bold")

    if (this.initialized && !forceRestart) {
      console.log("%cstopping AppService initialization; already initialized and not forcing restart", "font-weight:bold")
      return Promise.resolve()
    }

    if (this.initialized) {
      await ChromeListeners.resetListeners()
      await useWindowsStore().resetListeners()
    }

    this.initialized = true

    const appStore = useAppStore()
    const tabsStore = useTabsStore()
    const settingsStore = useSettingsStore()
    const bookmarksStore = useBookmarksStore()
    const messagesStore = useMessagesStore()
    const searchStore = useSearchStore()
    const uiStore = useUiStore()
    this.router = router

    uiStore.appLoading = true

    appStore.init()

    // init of stores and some listeners
    await usePermissionsStore().initialize(useDB(quasar).localDb)
    await ChromeListeners.initListeners()
    ChromeBookmarkListeners.initListeners()
    await bookmarksStore.init()
    await BookmarksService.init()
    settingsStore.initialize(quasar.localStorage);
    tabsStore.initialize(quasar.localStorage).catch((err) => console.error("***" + err))

    searchStore.init().catch((err) => console.error(err))


    // init db
    await IndexedDbPersistenceService.init("db")

    // init services
    useAuthStore().initialize(useDB(undefined).db)
    await useAuthStore().setUser(user)
    if (account) {
      useAuthStore().upsertAccount(account)
    }
    //useAuthStore().setProducts(Array.from(products))

    await useNotificationsStore().initialize(useDB(undefined).db)
    useSuggestionsStore().init(useDB(undefined).db)
    await messagesStore.initialize(useDB(undefined).db)

    tabsetService.setLocalStorage(localStorage)

    if (useAuthStore().isAuthenticated()) {
      // sync features
      const syncType = LocalStorage.getItem(SYNC_TYPE) as SyncType || SyncType.NONE
      const syncUrl = LocalStorage.getItem(SYNC_GITHUB_URL) as string
      const dbOrGitDb = useGitStore(syncType, syncUrl) ?
        useDB(undefined).gitDb :
        useDB(undefined).db
      console.debug("%cchecking sync config:", "font-weight:bold", syncType, syncUrl, dbOrGitDb)

      const gitInitResult = await GitPersistentService.init(syncType, syncUrl)
      console.log("%cgitInitResult", "font-weight:bold", gitInitResult)
      await this.initCoreSerivces(quasar, dbOrGitDb, this.router)
    } else {
      await this.initCoreSerivces(quasar, useDB(undefined).db, this.router)
    }


    useNotificationsStore().bookmarksExpanded = quasar.localStorage.getItem("bookmarks.expanded") || []

  }


  restart(ar: string) {
    console.log("%c>>> restarting tabsets", "font-weight:bold", window.location.href, ar)
    const baseLocation = window.location.href.split("?")[0]
    console.log("%c>>> baseLocation", "font-weight:bold", baseLocation)
    if (window.location.href.indexOf("?") < 0) {
      const tsIframe = window.parent.frames[0]
      //log("iframe", tsIframe)
      if (tsIframe) {
        console.debug("%c>>> new window.location.href", "font-weight:bold", baseLocation + "?" + ar)
        tsIframe.location.href = baseLocation + "?" + ar
        //tsIframe.location.href = "https://www.skysail.io"
        tsIframe.location.reload()
      }
    }
    useAuthStore().setAuthRequest(null as unknown as string)
  }

  private async initCoreSerivces(quasar: any, dbOrGitDb: PersistenceService, router: Router) {
    const spacesStore = useSpacesStore()
    const windowsStore = useWindowsStore()
    const groupsStore = useGroupsStore()
    const tabsStore = useTabsStore()

    await spacesStore.initialize(dbOrGitDb)
    await useTabsetService().init(dbOrGitDb, false)
    await MHtmlService.init()
    ChromeApi.init(router)

    if (usePermissionsStore().hasFeature(FeatureIdent.TAB_GROUPS)) {
      await groupsStore.initialize(useDB(undefined).db)
      groupsStore.initListeners()
    }

    await windowsStore.initialize(useDB(undefined).db)
    windowsStore.initListeners()

    useUiStore().appLoading = false

    // tabsets not in bex mode means running on "shared.tabsets.net"
    // probably running an import ("/imp/:sharedId")
    // we do not want to go to the welcome back
    if (tabsStore.tabsets.size === 0 && quasar.platform.is.bex && !useAuthStore().isAuthenticated()) {
      await router.push("/sidepanel/welcome")
    }


  }

}

export default new AppService();

