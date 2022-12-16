<template>

  <div class="row q-ma-none q-pa-none fit">
    <div class="col-2">

      <q-tabs
        v-model="tab"
        vertical
        active-color="primary"
        class="text-grey-9 q-mt-none q-mx-none greyBorderTopRight">
        <q-tab name="bookmarks" icon="o_bookmark">
          <q-tooltip>Your bookmarks</q-tooltip>
        </q-tab>
        <q-tab name="openTabs" icon="o_table_rows">
          <q-badge v-if="badgeThreshold()"
                   align="middle"
                   :style="thresholdStyle()" outline>{{ tabsStore.tabs.length }}
          </q-badge>
          <q-tooltip>Your open tabs</q-tooltip>
        </q-tab>
        <q-tab v-if="savedTabsCount > 0"
               name="savedTabs" icon="o_save">
          <q-tooltip>Your saved tabs</q-tooltip>
        </q-tab>
        <q-tab name="tabset" icon="o_tab" v-if="featureToggles.isEnabled('sidebar')">
          <q-tooltip>Your current tabset</q-tooltip>
        </q-tab>
        <q-tab v-if="rssTabsCount > 0"
               name="rss" icon="o_rss_feed">
          <q-tooltip>RSS Feeds</q-tooltip>
        </q-tab>
      </q-tabs>
    </div>
    <div class="col-10 q-mt-none q-mx-none greyBorderTop">

      <q-toolbar class="text-primary lightgrey">
        <div class="row fit">
          <q-toolbar-title>
            <div class="row justify-start items-baseline" v-text="drawerLabel()"></div>
          </q-toolbar-title>
        </div>
      </q-toolbar>

      <BookmarksTree v-if="tab === 'bookmarks'"/>

      <OpenTabs v-else-if="tab === 'openTabs'"/>

      <SavedTabs v-else-if="tab === 'savedTabs'"/>

      <RssTabs v-else-if="tab === 'rss'"/>

      <TabsetAsSidebar v-else/>

    </div>
  </div>

</template>

<script lang="ts" setup>
import {ref, watch, watchEffect} from "vue";
import BookmarksTree from "src/components/BookmarksTree.vue"
import OpenTabs from "src/components/OpenTabs.vue"
import SavedTabs from "src/components/SavedTabs.vue"
import RssTabs from "src/components/RssTabs.vue"
import TabsetAsSidebar from "src/components/TabsetAsSidebar.vue"
import {useNotificationsStore} from "stores/notificationsStore";
import {useRouter} from "vue-router";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useTabsStore} from "stores/tabsStore";
import {useSettingsStore} from "stores/settingsStore";
import MHtmlService from "src/services/MHtmlService";
import {MHtml} from "src/models/MHtml";
import {LeftDrawerTabs} from "stores/uiStore";
import {useUiService} from "src/services/useUiService";

const router = useRouter()

const uiService = useUiService()

const featureToggles = useFeatureTogglesStore()
const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()

const openTabsCountRatio = ref(0)
const tab = ref<LeftDrawerTabs>(uiService.leftDrawerActiveTab())
const rssTabsCount = ref(0)
const savedTabsCount = ref(0)

watch(() => tab.value, (currentValue, oldValue) => {
  console.log("selected2", tab.value, currentValue, oldValue)
  if (currentValue !== oldValue) {
    uiService.leftDrawerSetActiveTab(currentValue)
  }
})

watchEffect(() => {
  openTabsCountRatio.value = Math.min(tabsStore.tabs.length / settingsStore.thresholds['max' as keyof object], 1)
})

watchEffect(() => rssTabsCount.value = tabsStore.rssTabs?.length)

watchEffect(() => {

  // MHtmlService.getMHtmls()
  //   .then((res: MHtml[]) => {
  //     savedTabsCount.value = res.length
  //   })
})

const drawerLabel = () => {
  switch (tab.value) {
    case "bookmarks":
      return "Bookmarks"
    case "openTabs":
      return "Open Tabs"
    case "savedTabs":
      return "Saved Pages"
    case "tabset":
      return "Tabset Sidebar"
    case "rss":
      return "RSS Sidebar"
    default:
      return tab.value
  }
}

const thresholdStyle = () =>
  "color: hsl(" + (120 - Math.round(120 * openTabsCountRatio.value)) + " 80% 50%)"

const badgeThreshold = () => tabsStore.tabs.length >= settingsStore.thresholds['min' as keyof object]

</script>

<style lang="sass" scoped>
.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey

.greyBorderTopRight
  border-top: 1px solid $bordergrey
  border-right: 1px solid $bordergrey
</style>
