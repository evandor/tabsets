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
import {useSpacesStore} from "stores/spacesStore";
import MHtmlService from "src/services/MHtmlService";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import ChromeListeners from "src/services/ChromeListeners";
import {useRoute} from "vue-router";

const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featureTogglesStore = useFeatureTogglesStore()
const bookmarksStore = useBookmarksStore()
const searchStore = useSearchStore()
const windowsStore = useWindowsStore()
const spacesStore = useSpacesStore()
const route = useRoute()

const $q = useQuasar()

function isNewTabPage() {
  return route.path === '/newtab';
}

if (isNewTabPage()) {

  // init db
  IndexedDbPersistenceService.init()
    .then(() => {
      // init services
      tabsetService.setLocalStorage(localStorage)
      spacesService.init()
        .then(() => {
          tabsetService.init(isNewTabPage())
            .then(() => {
              MHtmlService.init()
              ChromeApi.init()
            })
        })
    })

} else {
  // init of stores
  featureTogglesStore.initialize(useQuasar().localStorage);
  tabsStore.initialize(useQuasar().localStorage);

  ChromeListeners.initListeners(isNewTabPage())

  tabGroupsStore.initialize();
  tabGroupsStore.initListeners();

  spacesStore.initialize();

  bookmarksStore.init()
  searchStore.init()
  windowsStore.init()

  const localStorage = useQuasar().localStorage

  // init db
  IndexedDbPersistenceService.init()
    .then(() => {
      // init services
      tabsetService.setLocalStorage(localStorage)
      spacesService.init()
        .then(() => {
          tabsetService.init(isNewTabPage())
            .then(() => {
              MHtmlService.init()
              ChromeApi.init()
            })
        })
    })



  useNotificationsStore().bookmarksExpanded = $q.localStorage.getItem("bookmarks.expanded") || []
}

$q.dark.set($q.localStorage.getItem('darkMode') || false)


</script>
