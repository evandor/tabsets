<template>

  <q-page style="padding-top: 50px">
    <div class="q-ma-none q-pa-none">

      <div class="q-ma-none" v-if="tabsetId">
        <SidePanelTabInfo :tabsetId="tabsetId"/>
      </div>

      <PanelTabList
          v-if="tabset"
          :tabsetType="tabset.type"
          :tabs="filteredTabs(tabset as Tabset)"/>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">

      <FirstToolbarHelper>

        <template v-slot:title>
          <div class="text-subtitle1 text-black">
            Tabset: {{ tabset?.name }}
          </div>
        </template>

        <template v-slot:iconsRight>
          <q-btn
              icon="close"
              @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)"
              color="black"
              flat
              class="q-ma-none q-pa-xs cursor-pointer"
              style="max-width:20px"
              size="10px">
            <q-tooltip class="tooltip">Close this view</q-tooltip>
          </q-btn>
        </template>

      </FirstToolbarHelper>

    </q-page-sticky>
  </q-page>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useRoute, useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {scroll, uid, useQuasar} from "quasar";
import {SidePanelView, useUiStore} from "src/stores/uiStore";
import PanelTabList from "components/layouts/PanelTabList.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useSpacesStore} from "src/stores/spacesStore";
import SidePanelTabInfo from "pages/sidepanel/SidePanelTabInfo.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {FeatureIdent} from "src/models/AppFeature";
import {DynamicTabSourceType} from "src/models/DynamicTabSource";
import {useWindowsStore} from "../stores/windowsStores";

const {inBexMode, sanitize, sendMsg} = useUtils()

const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()
const permissionsStore = usePermissionsStore()
const uiStore = useUiStore()

const tabsetId = ref<string | undefined>(undefined)
const tabset = ref<Tabset | undefined>(undefined)

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const tabs = ref<Map<string, Tab[]>>(new Map())

watchEffect(() => {
  tabsetId.value = route.params.tabsetId as string
  tabset.value = useTabsStore().getTabset(tabsetId.value)
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

const getTabsetOrder =
    [
      function (o: Tabset) {
        return o.status === TabsetStatus.FAVORITE ? 0 : 1
      },
      function (o: Tabset) {
        return o.name?.toLowerCase()
      }
    ]

watchEffect(() => {
  if (usePermissionsStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    tabsets.value = _.sortBy(
        _.filter([...tabsStore.tabsets.values()], (ts: Tabset) => {
          if (currentSpace) {
            if (ts.spaces.indexOf(currentSpace.id) < 0) {
              return false
            }
          }
          return ts.status !== TabsetStatus.DELETED
        }),
        getTabsetOrder, ["asc"])
  } else {
    tabsets.value = _.sortBy(
        _.filter([...tabsStore.tabsets.values()],
            (ts: Tabset) => ts.status !== TabsetStatus.DELETED),
        getTabsetOrder, ["asc"])
  }
})

const filteredTabs = (tabset: Tabset): Tab[] => {
  if (tabset.type === TabsetType.DYNAMIC &&
      tabset.dynamicTabs && tabset.dynamicTabs.type === DynamicTabSourceType.TAG) {
    const results: Tab[] = []
    const tag = tabset.dynamicTabs?.config['tags' as keyof object][0]
    _.forEach([...tabsStore.tabsets.values()], (tabset: Tabset) => {
      _.forEach(tabset.tabs, (tab: Tab) => {
        if (tab.tags?.indexOf(tag) >= 0) {
          results.push(tab)
        }
      })
    })
    return results
  }
  const tabs: Tab[] = tabset.tabs
  // TODO order??
  const filter = useUiStore().tabsFilter
  if (!filter || filter.trim() === '') {
    return tabs
  }
  return _.filter(tabs, (t: Tab) => {
    return (t.url || '')?.indexOf(filter) >= 0 ||
        (t.title || '')?.indexOf(filter) >= 0 ||
        t.description?.indexOf(filter) >= 0
  })
}

if (inBexMode() && chrome) {
  let queryOptions = {active: true, lastFocusedWindow: true};
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
}

</script>
