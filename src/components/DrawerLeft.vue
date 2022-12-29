<template>

  <div class="row q-ma-none q-pa-none fit">

    <div class="col-2">
      <DrawerLeftTabs/>
    </div>

    <div class="col-10 q-mt-none q-mx-none greyBorderTop">

      <q-toolbar class="text-primary lightgrey">
        <div class="row fit">
          <div class="col-xs-12 col-md-7">
            <q-toolbar-title>
              <div class="row justify-start items-baseline">
                <div class="col-1">
                  <span class="text-dark" :class="{
                    'animated flash': uiService.leftDrawerAnimate()
                  }">{{ drawerLabel() }}</span>
                </div>
              </div>
            </q-toolbar-title>
          </div>
          <div class="col-xs-12 col-md-5 q-ma-none q-mt-sm text-right">

            <div class="row">
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


      <BookmarksTree v-if="tab === LeftDrawerTabs.BOOKMARKS"/>
      <OpenTabs v-else-if="tab ===  LeftDrawerTabs.OPEN_TABS" :filter="filter"/>
      <UnassignedTabs v-else-if="tab ===  LeftDrawerTabs.UNASSIGNED_TABS" :filter="filter"/>
      <SavedTabs v-else-if="tab ===  LeftDrawerTabs.SAVED_TABS"/>
      <TabsetAsSidebar v-else-if="tab ===  LeftDrawerTabs.SIDEBAR"/>
      <RssTabs v-else-if="tab ===  LeftDrawerTabs.RSS"/>
      <ScheduledTabs v-else-if="tab ===  LeftDrawerTabs.SCHEDULED"/>
      <TabsetHelp v-else-if="tab ===  LeftDrawerTabs.HELP"/>

      <div v-else>unknown tab name {{ tab }}</div>
    </div>
  </div>

</template>

<script lang="ts" setup>
import {ref, watch, watchEffect} from "vue";
import BookmarksTree from "src/components/BookmarksTree.vue"
import OpenTabs from "src/components/OpenTabs.vue"
import SavedTabs from "src/components/SavedTabs.vue"
import UnassignedTabs from "src/components/UnassignedTabs.vue"
import RssTabs from "src/components/RssTabs.vue"
import ScheduledTabs from "src/components/ScheduledTabs.vue"
import TabsetAsSidebar from "src/components/TabsetAsSidebar.vue"
import DrawerLeftTabs from "src/components/DrawerLeftTabs.vue"
import {useRouter} from "vue-router";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useTabsStore} from "stores/tabsStore";
import {useSettingsStore} from "stores/settingsStore";
import {LeftDrawerTabs} from "stores/uiStore";
import {useUiService} from "src/services/useUiService";
import TabsetHelp from "components/TabsetHelp.vue";

const router = useRouter()

const uiService = useUiService()

const featureToggles = useFeatureTogglesStore()
const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()

const openTabsCountRatio = ref(0)
const tab = ref<LeftDrawerTabs>(uiService.leftDrawerActiveTab())
const rssTabsCount = ref(0)
const filter = ref<string>('')

watchEffect(() => tab.value = uiService.leftDrawerActiveTab())

watch(() => tab.value, (currentValue, oldValue) => {
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
    case LeftDrawerTabs.BOOKMARKS:
      return "Bookmarks"
    case LeftDrawerTabs.OPEN_TABS:
      return "Open Tabs"
    case LeftDrawerTabs.UNASSIGNED_TABS:
      return "Unassigned"
    case LeftDrawerTabs.SAVED_TABS:
      return "Saved Pages"
    case LeftDrawerTabs.SIDEBAR:
      return "Tabset Sidebar"
    case LeftDrawerTabs.RSS:
      return "RSS Sidebar"
    case LeftDrawerTabs.SCHEDULED:
      return "Scheduled"
    case LeftDrawerTabs.HELP:
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
