<template>

  <q-tabs
    v-model="tab"
    vertical
    active-color="primary"
    class="text-grey-9 q-mt-none q-mx-none greyBorderTopRight">

    <q-tab name="bookmarks" icon="o_bookmarks" @click="tabsClicked(LeftDrawerTabs.BOOKMARKS)">
      <q-tooltip>Your bookmarks</q-tooltip>
    </q-tab>

    <q-tab name="openTabs" icon="o_table_rows" @click="tabsClicked(LeftDrawerTabs.OPEN_TABS)">
      <q-badge v-if="badgeThreshold()"
               floating
               text-color="white"
               :style="thresholdStyle()">{{ tabsStore.tabs.length }}
      </q-badge>
      <q-tooltip>Your open tabs</q-tooltip>
    </q-tab>

    <q-tab v-if="tabsStore.pendingTabset?.tabs.length > 0"
           name="unassignedTabs" icon="o_fiber_new"

           @click="tabsClicked(LeftDrawerTabs.UNASSIGNED_TABS)">
      <q-badge v-if="badgeThreshold()"
               floating
               style="right:-2px"
               color="secondary">{{ tabsStore.pendingTabset?.tabs.length }}
      </q-badge>
      <q-tooltip>Your unassigned tabs</q-tooltip>
    </q-tab>

    <q-tab
           name="groupedByHostTabs" icon="o_dns" @click="tabsClicked(LeftDrawerTabs.GROUP_BY_HOST_TABS)">
      <q-tooltip>Your tabs grouped by host, if there are at least two tabs</q-tooltip>
    </q-tab>

    <q-tab v-if="savedTabsCount > 0"
           name="savedTabs" icon="o_save" @click="tabsClicked(LeftDrawerTabs.SAVED_TABS)">
      <q-tooltip>Your saved tabs</q-tooltip>
    </q-tab>

    <q-tab v-if="featureToggles.isEnabled('sidebar')"
           name="sidebar" icon="o_tab" @click="tabsClicked(LeftDrawerTabs.SIDEBAR)">
      <q-tooltip>Your current tabset as 'sidebar'</q-tooltip>
    </q-tab>

    <q-tab v-if="rssTabsCount > 0"
           name="rss" icon="o_rss_feed" @click="tabsClicked(LeftDrawerTabs.RSS)">
      <q-tooltip>RSS Feeds</q-tooltip>
    </q-tab>

    <q-tab
           name="scheduled" icon="o_update" @click="tabsClicked(LeftDrawerTabs.SCHEDULED)">
      <q-tooltip>Scheduled Tabs</q-tooltip>
    </q-tab>

    <q-tab v-if="permissionsStore.hasPermission('history')"
           name="history" icon="o_history" @click="tabsClicked(LeftDrawerTabs.HISTORY)">
      <q-tooltip>Browser History</q-tooltip>
    </q-tab>

    <q-tab
      name="help" icon="help" @click="tabsClicked(LeftDrawerTabs.HELP)">
      <q-tooltip>Help</q-tooltip>
    </q-tab>

  </q-tabs>


</template>

<script lang="ts" setup>
import {ref, watch, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useTabsStore} from "stores/tabsStore";
import {useSettingsStore} from "stores/settingsStore";
import {LeftDrawerTabs} from "stores/uiStore";
import {useUiService} from "src/services/useUiService";
import {usePermissionsStore} from "stores/permissionsStore";

const router = useRouter()

const uiService = useUiService()

const featureToggles = useFeatureTogglesStore()
const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()
const permissionsStore = usePermissionsStore()

const openTabsCountRatio = ref(0)
const tab = ref<LeftDrawerTabs>(uiService.leftDrawerActiveTab())
const rssTabsCount = ref(0)
const savedTabsCount = ref(0)

watch(() => tab.value, (currentValue) => {
  uiService.leftDrawerSetActiveTab(currentValue)
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

const tabsClicked = (tab: LeftDrawerTabs) => {
 // console.log("tabsClicked", tab)
  uiService.leftDrawerSetActiveTab(tab)
}

const thresholdStyle = () =>
  "background-color: hsl(" + (120 - Math.round(120 * openTabsCountRatio.value)) + " 80% 50%); right:-2px"

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
