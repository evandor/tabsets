<template>
  <router-view/>
</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore";
import {useQuasar} from "quasar";
import tabsetService from "src/services/TabsetService";
import spacesService from "src/services/SpacesService";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {useSearchStore} from "src/stores/searchStore";
import {useNotificationsStore} from "src/stores/notificationsStore";
import ChromeApi from "src/services/ChromeApi";
import {useWindowsStore} from "src/stores/windowsStores";
import {useSpacesStore} from "src/stores/spacesStore";
import MHtmlService from "src/services/MHtmlService";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import ChromeListeners from "src/services/ChromeListeners";
import {useRoute, useRouter} from "vue-router";
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import {usePermissionsStore} from "src/stores/permissionsStore";
import NotificationsService from "src/services/NotificationsService";
import {useSuggestionsStore} from "src/stores/suggestionsStore";
import {useUiStore} from "src/stores/uiStore";
import {useTabsetService} from "src/services/TabsetService2";
import {INDEX_DB_NAME} from "boot/constants";
import {useSettingsStore} from "src/stores/settingsStore";
import BookmarksService from "src/services/BookmarksService";
import {useUtils} from "src/services/Utils";
import {EventEmitter} from "events";

const {inBexMode} = useUtils()

const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()
const suggestionsStore = useSuggestionsStore()
const bookmarksStore = useBookmarksStore()
const windowsStore = useWindowsStore()
const searchStore = useSearchStore()
const spacesStore = useSpacesStore()
const uiStore = useUiStore()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()

// https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
const emitter = new EventEmitter()
emitter.setMaxListeners(12)

$q.dark.set($q.localStorage.getItem('darkMode') || false)

// init of stores and some listeners
usePermissionsStore().initialize()
  .then(() => {
    ChromeListeners.initListeners(false)
    ChromeBookmarkListeners.initListeners()
    bookmarksStore.init()
    BookmarksService.init()

    // console.log("activating dom script", usePermissionsStore().hasFeature(FeatureIdent.ANALYSE_TABS))
    // if (usePermissionsStore().hasFeature(FeatureIdent.ANALYSE_TABS)) {
    //   $q.bex.send('initDomScripts')
    // }
  })
settingsStore.initialize(useQuasar().localStorage);
tabsStore.initialize(useQuasar().localStorage);

searchStore.init()
windowsStore.init()

const localStorage = useQuasar().localStorage

// init db
IndexedDbPersistenceService.init(INDEX_DB_NAME)
  .then(() => {
    // init services
    NotificationsService.init()
    useSuggestionsStore().init()
    tabsetService.setLocalStorage(localStorage)
    spacesService.init()
      .then(() => {
        useTabsetService().init(false)
          .then(() => {
            MHtmlService.init()
            ChromeApi.init()
            // @ts-ignore
            if (tabsStore.tabsets.size === 0 && chrome.sidePanel) {
              router.push("/sidepanel/welcome")
            }
          })
      })
  })


useNotificationsStore().bookmarksExpanded = $q.localStorage.getItem("bookmarks.expanded") || []

// @ts-ignore
if (!inBexMode() || !chrome.sidePanel) {
  router.push("/start")
}

</script>
