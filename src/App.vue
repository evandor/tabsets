<template>
  <router-view />
</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {useQuasar} from "quasar";
import tabsetService from "src/services/TabsetService";
import backendApi from "src/services/BackendApi";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {useSyncStore} from "src/stores/syncStore";
import {useSearchStore} from "stores/searchStore";
import {useNotificationsStore} from "stores/notificationsStore";
import ChromeApi from "src/services/ChromeApi";

backendApi.init(process.env.BACKEND_URL || "unknown", null)

const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featureTogglesStore = useFeatureTogglesStore()
const bookmarksStore = useBookmarksStore()
const searchStore = useSearchStore()
const syncStore = useSyncStore()

const $q = useQuasar()

featureTogglesStore.initialize(useQuasar().localStorage);

tabsStore.initialize(useQuasar().localStorage);
tabsStore.initListeners();

tabGroupsStore.initialize();
tabGroupsStore.initListeners();

bookmarksStore.init()

searchStore.init()
syncStore.init()

tabsetService.setLocalStorage(useQuasar().localStorage)
tabsetService.init()

$q.dark.set($q.localStorage.getItem('darkMode') || false)
useNotificationsStore().bookmarksActive = $q.localStorage.getItem('bookmarksActive') || false
useNotificationsStore().showBookmarks = $q.localStorage.getItem('showBookmarks') || false
useNotificationsStore().bookmarksExpanded = $q.localStorage.getItem("bookmarks.expanded") || []

ChromeApi.init()

</script>
