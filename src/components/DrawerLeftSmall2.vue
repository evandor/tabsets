<template>

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

</template>

<script lang="ts" setup>
import {ref, watch, watchEffect} from "vue";
import {useNotificationsStore} from "stores/notificationsStore";
import {useRouter} from "vue-router";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useTabsStore} from "stores/tabsStore";
import {useSettingsStore} from "stores/settingsStore";
import {useUiService} from "src/services/useUiService";
import {LeftDrawerTabs} from "stores/uiStore";

const router = useRouter()

const featureToggles = useFeatureTogglesStore()
const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()

const uiService = useUiService()

const openTabsCountRatio = ref(0)
const tab = ref<LeftDrawerTabs>(uiService.leftDrawerActiveTab())
const rssTabsCount = ref(0)
const savedTabsCount = ref(0)

watchEffect(() => {
  //tab.value = useNotificationsStore().showOpenTabs ? 'openTabs' : 'bookmarks'
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


watch(() => tab.value, (currentValue, oldValue) => {
  console.log("selected", tab.value, currentValue, oldValue)
  uiService.leftDrawerSetActiveTab(currentValue)
})

// watchEffect(() => {
//   tab.value = uiService.leftDrawerActiveTab()
// })

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
