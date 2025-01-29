import _ from 'lodash'
import { QVueGlobals } from 'quasar'
import ChromeApi from 'src/app/BrowserApi'
import ChromeListeners from 'src/app/listeners/BrowserListeners'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import BookmarksService from 'src/bookmarks/services/BookmarksService'
import { useBookmarksStore } from 'src/bookmarks/stores/bookmarksStore'
import IndexedDbContentPersistence from 'src/content/persistence/IndexedDbContentPersistence'
import { useContentService } from 'src/content/services/ContentService'
import { SpaceInfo } from 'src/core/models/SpaceInfo'
import { TabsetInfo } from 'src/core/models/TabsetInfo'
import { useEntityRegistryStore } from 'src/core/stores/entityRegistryStore'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useNotesStore } from 'src/notes/stores/NotesStore'
import IndexedDbRequestPersistence from 'src/requests/persistence/IndexedDbRequestPersistence'
import { useRequestsService } from 'src/requests/services/RequestsService'
import { useSearchStore } from 'src/search/stores/searchStore'
import ChromeBookmarkListeners from 'src/services/ChromeBookmarkListeners'
import { useDB } from 'src/services/usePersistenceService'
import { useSnapshotsService } from 'src/snapshots/services/SnapshotsService'
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useAppStore } from 'src/stores/appStore'
import IndexedDbSuggestionsPersistence from 'src/suggestions/persistence/IndexedDbSuggestionsPersistence'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useGroupsStore } from 'src/tabsets/stores/groupsStore'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { watch } from 'vue'
import { Router } from 'vue-router'

class AppService {
  router: Router = null as unknown as Router
  initialized = false

  async init(quasar: QVueGlobals, router: Router, forceRestart = false) {
    console.log(
      `%cinitializing AppService: first start=${!this.initialized}, forceRestart=${forceRestart}, router set=${router !== undefined}`,
      'font-weight:bold',
    )

    if (this.initialized && !forceRestart) {
      console.debug('stopping AppService initialization; already initialized and not forcing restart')
      return Promise.resolve()
    }

    if (this.initialized) {
      await ChromeListeners.resetListeners()
      useWindowsStore().resetListeners()
    }

    this.initialized = true

    this.router = router

    useUiStore().appLoading = 'loading tabsets...'

    useAppStore().init()

    await ChromeListeners.initListeners()

    // Bookmarks
    ChromeBookmarkListeners.initListeners()

    useBookmarksStore().init()
    await BookmarksService.init()

    // Snapshots
    await useSnapshotsStore().initialize(useDB().snapshotsDb)
    await useSnapshotsService().init()

    // should be initialized before search submodule
    await useThumbnailsService().init(useDB().thumbnailsDb)

    await useContentService().init(IndexedDbContentPersistence)

    await useRequestsService().init(IndexedDbRequestPersistence)

    await useSearchStore()
      .init()
      .catch((err: any) => console.error(err))

    // init db
    // await IndexedDbPersistenceService.init('db')

    // init services
    await useSuggestionsStore().init(IndexedDbSuggestionsPersistence)

    //tabsetService.setLocalStorage(localStorage)

    await this.initCoreSerivces(quasar, this.router)
  }

  restart(ar: string) {
    console.error('%crestarting tabsets', 'font-weight:bold', window.location.href, ar)
    const baseLocation = window.location.href.split('?')[0]
    console.log('%cbaseLocation', 'font-weight:bold', baseLocation)
    console.log('%cwindow.location.href', 'font-weight:bold', window.location.href)
    if (window.location.href.indexOf('?') < 0) {
      const tsIframe = window.parent.frames[0]
      //log("iframe", tsIframe)
      if (tsIframe) {
        console.debug('%cnew window.location.href', 'font-weight:bold', baseLocation + '?' + ar)
        tsIframe.location.href = baseLocation + '?' + ar
        //tsIframe.location.href = "https://www.skysail.io"
        tsIframe.location.reload()
      }
    }
  }

  private async initCoreSerivces(quasar: QVueGlobals, router: Router) {
    console.log(`%cinitializing AppService: initCoreSerivces`, 'font-weight:bold')

    await useWindowsStore().initialize()
    useWindowsStore().initListeners()

    /**
     * features store: passing storage for better testing.
     * make sure features are not used before this line in code.
     */
    const featuresStorage = useDB(quasar).featuresDb
    await useFeaturesStore().initialize(featuresStorage)

    const localStorageTabsetsDb = useDB().localStorageTabsetsDb
    await useTabsetsUiStore().initialize(localStorageTabsetsDb)

    await useNotesStore().initialize(useDB().notesDb)

    /**
     * Pattern: TODO
     * initialize store with optional registry watcher and persistence
     * run persistence init code in store init
     * no persistence for service!
     */

    watch(useSpacesStore().spaces, (newSpaces: Map<string, any>) => {
      const spacesInfo = _.map([...newSpaces.values()], (ts: any) => new SpaceInfo(ts.id, ts.name))
      useEntityRegistryStore().spacesRegistry = spacesInfo
    })
    await useSpacesStore().initialize(useDB().spacesDb)

    const tabsetsStore = useTabsetsStore()
    watch(tabsetsStore.tabsets, (newTabsets: Map<string, any>) => {
      const tsInfo = _.map(
        [...newTabsets.values()],
        (ts: any) => new TabsetInfo(ts.id, ts.name, ts.window, ts.tabs.length),
      )
      useEntityRegistryStore().tabsetRegistry = tsInfo
    })
    await tabsetsStore.initialize(useDB().tabsetsDb)
    await useTabsetService().init(false)

    await useTabsStore2().initialize()

    const existingUrls = useTabsetsStore().getAllUrls()
    await useContentService().populateSearch(existingUrls)
    await useTabsetService().populateSearch()

    ChromeApi.init(router)

    if (useFeaturesStore().hasFeature(FeatureIdent.TAB_GROUPS)) {
      await useGroupsStore().initialize(useDB().groupsIndexedDb)
      useGroupsStore().initListeners()
    }

    useUiStore().appLoading = undefined

    // tabsets not in bex mode means running on "pwa.tabsets.net"
    // probably running an import ("/imp/:sharedId")
    // we do not want to go to the welcome back
    // console.log("checking for welcome page", useTabsetsStore().tabsets.size === 0, quasar.platform.is.bex, !useAuthStore().isAuthenticated)
    if (
      useTabsetsStore().tabsets.size === 0 &&
      quasar.platform.is.bex &&
      !router.currentRoute.value.path.startsWith('/fullpage') &&
      !router.currentRoute.value.path.startsWith('/mainpanel')
    ) {
      await router.push('/sidepanel/welcome')
    }

    // set badge, text and color
    useTabsetsUiStore().updateExtensionIcon()

    ChromeApi.buildContextMenu('AppService')
  }
}

export default new AppService()
