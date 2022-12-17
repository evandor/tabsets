<template>

  <div class="row q-ma-none q-pa-none fit">

    <div class="col-2">
      <DrawerLeftTabs/>
    </div>

    <div class="col-10 q-mt-none q-mx-none greyBorderTop">

      <!--      <q-toolbar class="text-primary lightgrey">-->
      <!--        <div class="row fit">-->
      <!--          <q-toolbar-title>-->
      <!--            <div class="row justify-start items-baseline" v-text="drawerLabel()"></div>-->
      <!--          </q-toolbar-title>-->
      <!--        </div>-->
      <!--      </q-toolbar>-->

      <q-toolbar class="text-primary lightgrey">
        <div class="row fit">
          <div class="col-xs-12 col-md-5">
            <q-toolbar-title>
              <div class="row justify-start items-baseline">
                <div class="col-1">
                  <span class="text-dark">{{ drawerLabel() }}</span>
                </div>
              </div>
            </q-toolbar-title>
          </div>
          <div class="col-xs-12 col-md-7 text-right">


            <q-btn
                   flat dense icon="o_filter_list"
                   color="primary"
                   class="q-ml-md q-mr-md"
                   >
              <q-tooltip>Apply Filter</q-tooltip>
            </q-btn>

          </div>
        </div>
      </q-toolbar>


      <BookmarksTree v-if="tab === LeftDrawerTabs.BOOKMARKS"/>
      <OpenTabs v-else-if="tab ===  LeftDrawerTabs.OPEN_TABS"/>
      <SavedTabs v-else-if="tab ===  LeftDrawerTabs.SAVED_TABS"/>
      <TabsetAsSidebar v-else-if="tab ===  LeftDrawerTabs.SIDEBAR"/>
      <RssTabs v-else-if="tab ===  LeftDrawerTabs.RSS"/>

      <div v-else>unknown tab name {{ tab }}</div>
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
import DrawerLeftTabs from "src/components/DrawerLeftTabs.vue"
import {useRouter} from "vue-router";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useTabsStore} from "stores/tabsStore";
import {useSettingsStore} from "stores/settingsStore";
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

watchEffect(() => tab.value = uiService.leftDrawerActiveTab())

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
    case LeftDrawerTabs.BOOKMARKS:
      return "Bookmarks"
    case LeftDrawerTabs.OPEN_TABS:
      return "Open Tabs"
    case LeftDrawerTabs.SAVED_TABS:
      return "Saved Pages"
    case LeftDrawerTabs.SIDEBAR:
      return "Tabset Sidebar"
    case LeftDrawerTabs.RSS:
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
