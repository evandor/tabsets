import ChromeListeners from "src/app/listeners/BrowserListeners";
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import BookmarksService from "src/bookmarks/services/BookmarksService";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useNotificationsStore} from "stores/notificationsStore";
import {useDB} from "src/services/usePersistenceService";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import tabsetService from "src/tabsets/services/TabsetService";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import ChromeApi from "src/app/BrowserApi";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {useSettingsStore} from "stores/settingsStore";
import {useBookmarksStore} from "src/bookmarks/stores/bookmarksStore";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {useSearchStore} from "src/search/stores/searchStore";
import {Router} from "vue-router";
import {useGroupsStore} from "src/tabsets/stores/groupsStore";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useAppStore} from "stores/appStore";
import {useUiStore} from "src/ui/stores/uiStore";
import {useThumbnailsService} from "src/thumbnails/services/ThumbnailsService";
import IndexedDbThumbnailsPersistence from "src/thumbnails/persistence/IndexedDbThumbnailsPersistence";
import {useContentService} from "src/content/services/ContentService";
import IndexedDbContentPersistence from "src/content/persistence/IndexedDbContentPersistence";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";
import {useSnapshotsStore} from "src/snapshots/stores/SnapshotsStore";
import {useNotesStore} from "src/notes/stores/NotesStore";
import {watch} from "vue";
import _ from "lodash"
import {useEntityRegistryStore} from "src/core/stores/entityRegistryStore";
import {TabsetInfo} from "src/core/models/TabsetInfo";
import {SpaceInfo} from "src/core/models/SpaceInfo";

class AppService {

  router: Router = null as unknown as Router
  initialized = false

  async init(quasar: any, router: Router, forceRestart = false) {

    console.log(`%cinitializing AppService: first start=${!this.initialized}, forceRestart=${forceRestart}, quasar set=${quasar !== undefined}, router set=${router !== undefined}`, forceRestart ? "font-weight:bold" : "")

    if (this.initialized && !forceRestart) {
      console.debug("stopping AppService initialization; already initialized and not forcing restart")
      return Promise.resolve()
    }

    if (this.initialized) {
      await ChromeListeners.resetListeners()
      await useWindowsStore().resetListeners()
    }

    this.initialized = true

    const appStore = useAppStore()
    const settingsStore = useSettingsStore()
    const bookmarksStore = useBookmarksStore()
    const searchStore = useSearchStore()
    const uiStore = useUiStore()

    this.router = router

    uiStore.appLoading = "loading tabsets..."

    appStore.init()

    // init of stores and some listeners
    // await usePermissionsStore().initialize(useDB(quasar).localDb)


    await ChromeListeners.initListeners()

    ChromeBookmarkListeners.initListeners()
    await bookmarksStore.init()
    await BookmarksService.init()

    //settingsStore.initialize(quasar.localStorage);

    await useSnapshotsService().init()
    await useSnapshotsStore().initialize(useDB().snapshotsIndexedDb)

    // should be initialized before search submodule
    await useThumbnailsService().init(IndexedDbThumbnailsPersistence)
    await useContentService().init(IndexedDbContentPersistence)

    await searchStore.init().catch((err) => console.error(err))

    // init db
    await IndexedDbPersistenceService.init("db")

    // init services
    await useNotificationsStore().initialize(useDB(undefined).db)
    await useSuggestionsStore().init()

    tabsetService.setLocalStorage(localStorage)

    await this.initCoreSerivces(quasar, this.router)

    useNotificationsStore().bookmarksExpanded = quasar.localStorage.getItem("bookmarks.expanded") || []

  }


  restart(ar: string) {
    console.log("%crestarting tabsets", "font-weight:bold", window.location.href, ar)
    const baseLocation = window.location.href.split("?")[0]
    console.log("%cbaseLocation", "font-weight:bold", baseLocation)
    console.log("%cwindow.location.href", "font-weight:bold", window.location.href)
    if (window.location.href.indexOf("?") < 0) {
      const tsIframe = window.parent.frames[0]
      //log("iframe", tsIframe)
      if (tsIframe) {
        console.debug("%cnew window.location.href", "font-weight:bold", baseLocation + "?" + ar)
        tsIframe.location.href = baseLocation + "?" + ar
        //tsIframe.location.href = "https://www.skysail.io"
        tsIframe.location.reload()
      }
    }
  }

  private async initCoreSerivces(quasar: any, router: Router) {
    const groupsStore = useGroupsStore()
    const registryStore = useEntityRegistryStore()

    /**
     * features store: passing storage for better testing.
     * make sure features are not used before this line in code.
     */
    await useFeaturesStore().initialize(useDB(quasar).featuresLocalStorage)

    await useNotesStore().initialize(useDB().notesDb)
    console.debug('')

    /**
     * windows store
     */
    await useWindowsStore().initialize()
    useWindowsStore().initListeners()

    /**
     * Pattern: TODO
     * initialize store with optional registry watcher and persistence
     * run persistence init code in store init
     * no persistence for service!
     */

    const spacesStore = useSpacesStore()
    watch(spacesStore.spaces, (newSpaces:Map<string,any>) => {
      const spacesInfo = _.map([...newSpaces.values()], (ts: any) => new SpaceInfo(ts.id, ts.name))
      registryStore.spacesRegistry = spacesInfo
    })
    await spacesStore.initialize(useDB().spacesIndexedDb)
    console.debug('')

    const tabsetsStore = useTabsetsStore()
    watch(tabsetsStore.tabsets, (newTabsets:Map<string,any>) => {
      const tsInfo = _.map([...newTabsets.values()], (ts: any) => new TabsetInfo(ts.id, ts.name, ts.window, ts.tabs.length))
      registryStore.tabsetRegistry = tsInfo
    })
    await tabsetsStore.initialize(useDB().tabsetsIndexedDb)
    await useTabsetService().init(false)
    console.debug('')
    await useTabsStore2().initialize()



    const existingUrls = useTabsetsStore().getAllUrls()
    await useContentService().populateSearch(existingUrls)
    await useTabsetService().populateSearch()


    ChromeApi.init(router)

    if (useFeaturesStore().hasFeature(FeatureIdent.TAB_GROUPS)) {
      await groupsStore.initialize(useDB().groupsIndexedDb)
      groupsStore.initListeners()
    }

    useUiStore().appLoading = undefined

    // tabsets not in bex mode means running on "pwa.tabsets.net"
    // probably running an import ("/imp/:sharedId")
    // we do not want to go to the welcome back
    // console.log("checking for welcome page", useTabsetsStore().tabsets.size === 0, quasar.platform.is.bex, !useAuthStore().isAuthenticated)
    if (useTabsetsStore().tabsets.size === 0 &&
      quasar.platform.is.bex &&
      !router.currentRoute.value.path.startsWith("/fullpage") &&
      !router.currentRoute.value.path.startsWith("/mainpanel")) {
      await router.push("/sidepanel/welcome")
    }

    ChromeApi.buildContextMenu("AppService")

  }


}

export default new AppService();

