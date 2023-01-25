<template>

  <div class="row q-ma-none q-pa-none fit">

    <div class="col-12 q-mt-none q-mx-none greyBorderTop">

      <q-toolbar class="text-primary lightgrey">
        <div class="row fit">
          <div class="col-xs-12 col-md-9">
            <q-toolbar-title>
              <div class="row justify-start items-baseline">
                <div class="col-1">
                  {{ drawerLabel() }}
                </div>
              </div>
            </q-toolbar-title>
          </div>
          <div class="col-xs-12 col-md-3 q-ma-none q-mt-sm text-right">

            <span v-if="useUiStore().rightDrawerShowCloseButton()"
                  class="text-subtitle2 cursor-pointer"
                  @click="closeCurrentView()">              X</span>
            <q-tooltip class="tooltip">Close this view</q-tooltip>

            <div class="row" v-if="tab === DrawerTabs.OPEN_TABS">
              <div class="col">
                <span class="text-caption ellipsis">{{ filter }}</span>
                <q-btn
                  flat dense icon="o_filter_list"
                  :color="filter ? 'secondary' : 'primary'"
                  size="0.8em"
                  class="q-ml-md q-mr-none">
                  <q-tooltip v-if="filter">Apply Filter: '{{ filter }}'</q-tooltip>
                  <q-tooltip v-else>Apply Filter</q-tooltip>
                </q-btn>
                <q-popup-edit v-model="filter" v-slot="scope">
                  <q-input
                    autofocus
                    dense
                    maxlength="9"
                    v-model="scope.value"
                    :model-value="scope.value"
                    @update:model-value="val => setFilter2( val)"
                    hint="Filter open Tabs"
                    @keyup.enter="scope.set">
                    <template v-slot:after>
                      <q-btn
                        flat dense color="warning" icon="cancel" v-close-popup
                        @click="cancelFilter()"
                      />
                    </template>
                  </q-input>
                </q-popup-edit>
              </div>
            </div>

          </div>
        </div>
      </q-toolbar>

      <UnassignedAndOpenTabs v-if="tab === DrawerTabs.UNASSIGNED_TABS"/>
      <BookmarksTree v-else-if="tab === DrawerTabs.BOOKMARKS"/>
      <!--      <OpenTabs v-else-if="tab ===  DrawerTabs.OPEN_TABS" :filter="filter"/>-->
      <!--      <UnassignedTabs v-else-if="tab ===  DrawerTabs.UNASSIGNED_TABS" :filter="filter"/>-->
      <!--      <TabsGroupedByHost v-else-if="tab ===  DrawerTabs.GROUP_BY_HOST_TABS"/>-->
      <!--      <SavedTabs v-else-if="tab ===  DrawerTabs.SAVED_TABS"/>-->
      <TabsetAsSidebar v-else-if="tab ===  DrawerTabs.SIDEBAR"/>
      <!--      <RssTabs v-else-if="tab ===  DrawerTabs.RSS"/>-->
      <!--      <ScheduledTabs v-else-if="tab ===  DrawerTabs.SCHEDULED"/>-->
      <!--      <BrowserHistory v-else-if="tab ===  DrawerTabs.HISTORY"/>-->
      <Features v-else-if="tab ===  DrawerTabs.FEATURES"/>
      <!--      <TabsetHelp v-else-if="tab ===  DrawerTabs.HELP"/>-->

      <div v-else>unknown tab name {{ tab }}</div>
    </div>
  </div>

</template>

<script lang="ts" setup>
import {ref, watch, watchEffect} from "vue";
import OpenTabs from "src/components/OpenTabs.vue"
import SavedTabs from "src/components/SavedTabs.vue"
import UnassignedTabs from "src/components/UnassignedTabs.vue"
import RssTabs from "src/components/RssTabs.vue"
import ScheduledTabs from "src/components/ScheduledTabs.vue"
import TabsetAsSidebar from "src/components/TabsetAsSidebar.vue"
import {useRouter} from "vue-router";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useTabsStore} from "stores/tabsStore";
import {useSettingsStore} from "stores/settingsStore";
import {DrawerTabs, useUiStore} from "stores/uiStore";
import {useUiService} from "src/services/useUiService";
import TabsetHelp from "components/TabsetHelp.vue";
import TabsGroupedByHost from "components/TabsGroupedByHost.vue";
import BrowserHistory from "components/BrowserHistory.vue";
import Features from "components/Features.vue";
import UnassignedAndOpenTabs from "components/views/UnassignedAndOpenTabs.vue";
import BookmarksTree from "components/BookmarksTree.vue";

const router = useRouter()

const uiService = useUiService()

const featureToggles = useFeatureTogglesStore()
const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()

const openTabsCountRatio = ref(0)
const tab = ref<DrawerTabs>(uiService.rightDrawerActiveTab())
const rssTabsCount = ref(0)
const filter = ref<string>('')

watchEffect(() => tab.value = uiService.rightDrawerActiveTab())

watch(() => tab.value, (currentValue, oldValue) => {
  if (currentValue !== oldValue) {
    uiService.rightDrawerSetActiveTab(currentValue)
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
    case DrawerTabs.BOOKMARKS:
      return "Bookmarks"
    case DrawerTabs.OPEN_TABS:
      return "Open Tabs"
    case DrawerTabs.UNASSIGNED_TABS:
      return "Tabs to add"
    case DrawerTabs.GROUP_BY_HOST_TABS:
      return "Grouped by Host"
    case DrawerTabs.SAVED_TABS:
      return "Saved Pages"
    case DrawerTabs.SIDEBAR:
      return "Tabset Sidebar"
    case DrawerTabs.RSS:
      return "RSS Sidebar"
    case DrawerTabs.SCHEDULED:
      return "Scheduled"
    case DrawerTabs.HISTORY:
      return "History"
    case DrawerTabs.FEATURES:
      return "Add. Features"
    case DrawerTabs.HELP:
      return "Help"
    default:
      return tab.value
  }
}

const cancelFilter = () => {
  console.log("cancelFilter")
  filter.value = ''
}
const setFilter2 = (newVal: string) => {
  console.log("newVal2", newVal)
  filter.value = newVal
}
const closeCurrentView = () => useUiService().closeCurrentView()


</script>


