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
console.log("start", new Date().getTime())
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

const localStorage = useQuasar().localStorage


// watchEffect(() => {
//   //console.log("get current route!!", useRouter().currentRoute)
//  // if (useRouter() && useRouter().currentRoute) {
//   if (router && router.currentRoute) {
//     console.log("currentRoute!", router.currentRoute.value.fullPath)
//     if (router.currentRoute.value.fullPath !== "/popup") {
//     //   // init of stores and some listeners
//     //   usePermissionsStore().initialize()
//     //     .then(() => {
//     //       ChromeListeners.initListeners(false)
//     //       ChromeBookmarkListeners.initListeners()
//     //       bookmarksStore.init()
//     //     })
//     //   featureTogglesStore.initialize(localStorage);
//     //   tabsStore.initialize(localStorage);
//     //
//     //
//     //   tabGroupsStore.initialize();
//     //   tabGroupsStore.initListeners();
//     //
//     //   spacesStore.initialize();
//     //
//     //   searchStore.init()
//     //   windowsStore.init()
//     //
//     //
//     //
//     //   // init db
//     //   IndexedDbPersistenceService.init()
//     //     .then(() => {
//     //       // init services
//     //       LoggingService.init()
//     //       NotificationsService.init()
//     //       useSuggestionsStore().init()
//     //       tabsetService.setLocalStorage(localStorage)
//     //       spacesService.init()
//     //         .then(() => {
//     //           useTabsetService().init(isNewTabPage())
//     //             .then(() => {
//     //               MHtmlService.init()
//     //               ChromeApi.init()
//     //             })
//     //         })
//     //     })
//     //
//     //
//     //   useNotificationsStore().bookmarksExpanded = $q.localStorage.getItem("bookmarks.expanded") || []
//     //
//       console.log("pushing /start")
//       router.push("/start")
//     }
//   }
// })

function isNewTabPage() {
  return route.path === '/newtab';
}

$q.dark.set($q.localStorage.getItem('darkMode') || false)

if (isNewTabPage()) {

  // init db


} else {
  if (!window.location.href.endsWith("#/popup")) {
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

    // init db
    IndexedDbPersistenceService.init()
      .then(() => {
        // init services
        LoggingService.init()
        NotificationsService.init()
        useSuggestionsStore().init()
        tabsetService.setLocalStorage(localStorage)
        spacesService.init()
          .then(() => {
            useTabsetService().init(isNewTabPage())
              .then(() => {
                MHtmlService.init()
                ChromeApi.init()
              })
          })
      })


    useNotificationsStore().bookmarksExpanded = $q.localStorage.getItem("bookmarks.expanded") || []
    router.push("/start")
  }
}
console.log("end", new Date().getTime())


</script>
