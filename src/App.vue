<template>
  <router-view />
</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {useQuasar} from "quasar";
import tabsetService from "src/services/TabsetService";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {useSearchStore} from "src/stores/searchStore";
import {useNotificationsStore} from "src/stores/notificationsStore";
import ChromeApi from "src/services/ChromeApi";
import {useWindowsStore} from "src/stores/windowsStores";

const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featureTogglesStore = useFeatureTogglesStore()
const bookmarksStore = useBookmarksStore()
const searchStore = useSearchStore()
const windowsStore = useWindowsStore()

const $q = useQuasar()

featureTogglesStore.initialize(useQuasar().localStorage);

tabsStore.initialize(useQuasar().localStorage);
tabsStore.initListeners();

tabGroupsStore.initialize();
tabGroupsStore.initListeners();

bookmarksStore.init()
searchStore.init()
windowsStore.init()

tabsetService.setLocalStorage(useQuasar().localStorage)
tabsetService.init()
  .then(() => {
    ChromeApi.init()
  })

$q.dark.set($q.localStorage.getItem('darkMode') || false)

useNotificationsStore().showBookmarks = $q.localStorage.getItem('showBookmarks') || false
useNotificationsStore().bookmarksExpanded = $q.localStorage.getItem("bookmarks.expanded") || []

</script>
