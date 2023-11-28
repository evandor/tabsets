<template>

  <q-page style="padding-top: 50px">
    <div class="q-ma-none q-pa-none">

      <SidePanelPageTabList
          v-if="tabset"
          :tabsetType="tabset.type"
          :sorting="sorting"
          :show-tabsets="true"
          :preventDragAndDrop="preventDragAndDrop(sorting)"
          :tabsetId="tabset.id"/>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">

      <FirstToolbarHelper>

        <template v-slot:title>
          <div class="text-subtitle1 text-black">
            <SidePanelTabsetsSelectorWidget/>
          </div>
        </template>

        <template v-slot:iconsRight>

          <q-btn v-if="sorting !== TabSorting.CUSTOM"
                 :icon="descending ? 'arrow_upward' : 'arrow_downward'"
                 @click="toggleOrder()"
                 color="accent"
                 flat
                 class="q-ma-none q-pa-xs cursor-pointer"
                 style="max-width:20px"
                 size="10px">
            <q-tooltip class="tooltip" v-if="descending">Descending</q-tooltip>
            <q-tooltip class="tooltip" v-else>Ascending</q-tooltip>
          </q-btn>

          <q-btn
              icon="sort"
              @click="toggleSorting()"
              color="accent"
              flat
              class="q-ma-none q-pa-xs cursor-pointer"
              style="max-width:20px"
              size="10px">
            <q-tooltip class="tooltip">Toggle Sorting - now: {{ sorting }}</q-tooltip>
          </q-btn>

<!--          <span class="q-ma-none q-pa-none q-mx-sm text-grey-5">|</span>-->

        </template>

      </FirstToolbarHelper>

    </q-page-sticky>
  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab, TabSorting} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";
import {useRoute} from "vue-router";
import {useUtils} from "src/services/Utils";
import {useUiStore} from "src/stores/uiStore";
import SidePanelTabInfo from "pages/sidepanel/SidePanelTabInfo.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {useWindowsStore} from "src/stores/windowsStore";
import Analytics from "src/utils/google-analytics";
import SidePanelTabsetsSelectorWidget from "components/widgets/SidePanelTabsetsSelectorWidget.vue";
import {useQuasar} from "quasar";
import SidePanelPageTabList from "components/layouts/SidePanelPageTabList.vue";

const {inBexMode} = useUtils()

const $q = useQuasar()
const route = useRoute()

const tabsetId = ref<string | undefined>(undefined)
const tabset = ref<Tabset | undefined>(undefined)

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)

const sorting = ref<TabSorting>(TabSorting.CUSTOM)
const descending = ref<boolean>(false)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelTabsetPage', document.location.href);
})

watchEffect(() => {
  tabsetId.value = route.params.tabsetId as string
  tabset.value = useTabsStore().getTabset(tabsetId.value)
  if (tabset.value) {
    useTabsStore().selectCurrentTabset(tabset.value.id)
  }
})

const tabsets = ref<Tabset[]>([])
const selectedTab = ref<Tab | undefined>(undefined)

watchEffect(() => {
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
  }
})

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})

watchEffect(() => {
  const windowId = useWindowsStore().currentWindow?.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
})

if (inBexMode() && chrome) {
  let queryOptions = {active: true, lastFocusedWindow: true};
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
}

const toggleSorting = () => {
  switch (sorting.value) {
    case TabSorting.CUSTOM:
      sorting.value = TabSorting.TITLE
      break
    case TabSorting.TITLE:
      sorting.value = TabSorting.URL
      break
    case TabSorting.URL:
      sorting.value = TabSorting.AGE
      break
    case TabSorting.AGE:
      sorting.value = TabSorting.CUSTOM
      break
    default:
      sorting.value = TabSorting.CUSTOM
  }
}

const toggleOrder = () => descending.value = !descending.value

const preventDragAndDrop = (sorting:TabSorting) => $q.platform.is.mobile || sorting !== TabSorting.CUSTOM

</script>
