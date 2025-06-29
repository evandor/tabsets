import { User } from 'firebase/auth/web-extension'
import _ from 'lodash'
import { LocalStorage, QVueGlobals } from 'quasar'
import ChromeApi from 'src/app/BrowserApi'
import FirebaseListener from 'src/app/FirebaseListener'
import BrowserListeners from 'src/app/listeners/BrowserListeners'
import BookmarksService from 'src/bookmarks/services/BookmarksService'
import { useBookmarksStore } from 'src/bookmarks/stores/bookmarksStore'
import { EXTENSION_NAME } from 'src/boot/constants'
import IndexedDbContentPersistence from 'src/content/persistence/IndexedDbContentPersistence'
import { useContentService } from 'src/content/services/ContentService'
import BexFunctions from 'src/core/communication/BexFunctions'
import { SpaceInfo } from 'src/core/models/SpaceInfo'
import { TabsetInfo } from 'src/core/models/TabsetInfo'
import { useUtils } from 'src/core/services/Utils'
import { useAppStore } from 'src/core/stores/appStore'
import { useEntityRegistryStore } from 'src/core/stores/entityRegistryStore'
import { useEventsStore } from 'src/events/stores/eventsStore'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useMessagesStore } from 'src/messages/stores/messagesStore'
import IndexedDbRequestPersistence from 'src/requests/persistence/IndexedDbRequestPersistence'
import { useRequestsService } from 'src/requests/services/RequestsService'
import { useSearchStore } from 'src/search/stores/searchStore'
import ChromeBookmarkListeners from 'src/services/ChromeBookmarkListeners'
import { useDB } from 'src/services/usePersistenceService'
import { useSnapshotsService } from 'src/snapshots/services/SnapshotsService'
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useAuthStore } from 'src/stores/authStore'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { watch } from 'vue'
import { Router } from 'vue-router'

const { inBexMode } = useUtils()

class AppService {
  router: Router = null as unknown as Router
  initialized = false

  async init(quasar: QVueGlobals, router: Router, user: User | undefined = undefined) {
    console.log(`initializing AppService: initialized=${this.initialized}, router set=${router !== undefined}`)

    if (this.initialized) {
      console.debug('stopping AppService initialization; already initialized and not forcing restart')
      return Promise.resolve()
    }

    if (this.initialized) {
      //await ChromeListeners.resetListeners()
      useWindowsStore().resetListeners()
    }

    this.initialized = true
    await useAuthStore().setUser(user)

    this.router = router

    useUiStore().appLoading = `loading ${EXTENSION_NAME}...`

    useAppStore().init()

    await BrowserListeners.initListeners()

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

    if (inBexMode()) {
      chrome.tabs.query({ active: true, currentWindow: true }).then((currentTabs: chrome.tabs.Tab[]) => {
        console.log('currentTab', currentTabs)
        if (currentTabs.length > 0 && currentTabs[0]!.id) {
          chrome.tabs
            .sendMessage(currentTabs[0]!.id, 'getExcerpt', {})
            .then((payload) => {
              BexFunctions.handleBexTabExcerpt({ from: '', to: '', event: '', payload })
            })
            .catch((err) => {
              console.log('could not handle tab excerpt', err)
            })
        }
      })
    }

    await useRequestsService().init(IndexedDbRequestPersistence)

    await useSearchStore()
      .init()
      .catch((err: any) => console.error(err))

    // init services
    await useSuggestionsStore().init(useDB().suggestionsDb)

    await this.initCoreSerivces(quasar, this.router)
  }

  private async initCoreSerivces(quasar: QVueGlobals, router: Router) {
    //console.log(`%cinitializing AppService: initCoreSerivces`, 'font-weight:bold')

    const authenticated = useAuthStore().isAuthenticated()

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
    await tabsetsStore.initialize(authenticated ? useDB().tabsetsDb : useDB().localTabsetsDb)
    await useTabsetService().init()

    await useTabsStore2().initialize()

    const existingUrls = useTabsetsStore().getAllUrls()
    await useContentService().populateSearch(existingUrls)
    await useTabsetService().populateSearch()

    useMessagesStore().initialize()
    useEventsStore().initialize()

    ChromeApi.init()

    // if (useFeaturesStore().hasFeature(FeatureIdent.TAB_GROUPS)) {
    //   // await groupsStore.initialize(useDB(undefined).db)
    //   groupsStore.initListeners()
    // }

    useUiStore().appLoading = undefined

    // tabsets not in bex mode means running on "pwa.tabsets.net"
    // probably running an import ("/imp/:sharedId")
    // we do not want to go to the welcome back
    // console.log("checking for welcome page", useTabsetsStore().tabsets.size === 0, quasar.platform.is.bex, !useAuthStore().isAuthenticated)
    if (
      useTabsetsStore().tabsets.size === 0 &&
      quasar.platform.is.bex &&
      //useAuthStore().isAuthenticated() &&
      !router.currentRoute.value.path.startsWith('/fullpage') &&
      !router.currentRoute.value.path.startsWith('/mainpanel') &&
      router.currentRoute.value.path !== '/'
    ) {
      console.log('pushing to welcome (pro) page', router.currentRoute.value.path)
      const welcomePageHasBeenShown = LocalStorage.getItem('ui.welcomepro.shown') as boolean
      if (welcomePageHasBeenShown) {
        await router.push('/sidepanel/welcome')
        return
      }
      await router.push('/sidepanel/welcomepro')
      return
    }

    if (useAuthStore().user?.uid) {
      FirebaseListener.startListening()
    }

    // set badge, text and color
    //useTabsetsUiStore().updateExtensionIcon()

    ChromeApi.buildContextMenu('AppService')
  }
}

export default new AppService()
