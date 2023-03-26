<template>
  <router-view/>
</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {useQuasar} from "quasar";
import tabsetService from "src/services/TabsetService";
import spacesService from "src/services/SpacesService";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
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
import LoggingService from "src/services/LoggingService";
import NotificationsService from "src/services/NotificationsService";
import {useSuggestionsStore} from "src/stores/suggestionsStore";
import {useUiStore} from "src/stores/uiStore";
import {useTabsetService} from "src/services/TabsetService2";
import {computed, ref, watch, watchEffect} from "vue";
import PouchDbPersistenceService from "src/services/PouchDbPersistenceService";
import {INDEX_DB_NAME} from "boot/constants";
import {useAuth0} from "@auth0/auth0-vue";
// import PouchDbPersistenceService from "src/services/PouchDbPersistenceService";


// function isNewTabPage() {
//   return route.path === '/newtab';
// }
//
// $q.dark.set($q.localStorage.getItem('darkMode') || false)

// if (isNewTabPage()) {
//
//   // init db
//
//
// } else {
//

const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featureTogglesStore = useFeatureTogglesStore()
const suggestionsStore = useSuggestionsStore()
const bookmarksStore = useBookmarksStore()
const windowsStore = useWindowsStore()
const searchStore = useSearchStore()
const spacesStore = useSpacesStore()
const uiStore = useUiStore()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const auth0 = useAuth0()

// init of stores and some listeners
usePermissionsStore().initialize()
  .then(() => {
    ChromeListeners.initListeners(false)
    ChromeBookmarkListeners.initListeners()
    bookmarksStore.init()
  })
featureTogglesStore.initialize(useQuasar().localStorage);
tabsStore.initialize(useQuasar().localStorage);


searchStore.init()
windowsStore.init()

const localStorage = useQuasar().localStorage

console.log("Here: ", auth0.isAuthenticated.value)
const dbName = localStorage.getItem("current.user") && auth0.isAuthenticated.value ?
  "db-" + localStorage.getItem('current.user') : INDEX_DB_NAME;
console.log("d:", dbName)

// init db
IndexedDbPersistenceService.init(dbName)
  .then(() => {
    // init services
    PouchDbPersistenceService.init(dbName)
    LoggingService.init()
    NotificationsService.init()
    useSuggestionsStore().init()
    tabsetService.setLocalStorage(localStorage)
    spacesService.init()
      .then(() => {
        useTabsetService().init(false)
          .then(() => {
            MHtmlService.init()
            ChromeApi.init()
          })
      })
  })


useNotificationsStore().bookmarksExpanded = $q.localStorage.getItem("bookmarks.expanded") || []
if (!window.location.href.endsWith("#/popup")) {
  router.push("/start")
}


</script>
