<template>
  <span class="cursor-pointer text-right" :style="props.showLabel ? 'min-width:160px' : 'max-width:30px'">
    <q-badge
      v-if="showThresholdBar() && props.showLabel"
      :multi-line="false"
      class="q-mr-sm"
      color="primary"
      text-color="white"
      :label="thresholdLabel()">
    </q-badge>

    <q-circular-progress
      v-if="showThresholdBar()"
      :show-value="props.showLabel"
      reverse
      :value="openTabsCountRatio2"
      :size="props.inSidePanel ? '16px' : '20px'"
      :thickness="0.5"
      :style="thresholdStyle()"
      track-color="grey-3"
      class="q-ml-xs">
    </q-circular-progress>
    <q-tooltip class="tooltip-small" anchor="center right" self="center left"
      >Open Tabs: {{ useTabsStore2().browserTabs.length }} - click to manage</q-tooltip
    >
    <span v-if="openTabsCountRatio2 > 70" style="font-size: 11px; position: relative; top: 7px">{{
      useTabsStore2().browserTabs.length
    }}</span>
  </span>
  <q-menu :offset="[0, 15]">
    <q-list dense style="min-width: 200px">
      <!--      <q-item v-if="!props.inSidePanel" clickable v-close-popup @click="showOpenTabs">-->
      <!--        <q-item-section>Show open tabs</q-item-section>-->
      <!--      </q-item>-->
      <q-separator />
      <q-item disable>Clean up tabs:</q-item>
      <q-item clickable :disable="ignoredTabsCount === 0" v-close-popup @click="closeIgnoredTabs()">
        <q-item-section>&bull; Close {{ ignoredTabsCount }} ignored tabs</q-item-section>
      </q-item>
      <q-item
        :disable="useTabsetsStore().tabsets?.size === 0 || trackedTabsCount === 0"
        clickable
        v-close-popup
        @click="closeTrackedTabs()">
        <q-item-section>&bull; Close {{ trackedTabsCount }} tracked tabs</q-item-section>
      </q-item>
      <!--      <q-item clickable v-close-popup @click="TabsetService.closeDuplictedOpenTabs()">-->
      <!--        <q-item-section>&bull; Close duplicated open tabs</q-item-section>-->
      <!--      </q-item>-->
      <q-item
        v-if="useFeaturesStore().hasFeature(FeatureIdent.BACKUP) && useTabsStore2().browserTabs.length > 1"
        clickable
        v-close-popup
        @click="backupAndClose">
        <q-item-section>&bull; Move all to Backup...</q-item-section>
      </q-item>
      <q-item
        :disable="useTabsStore2().browserTabs.length <= 1"
        clickable
        v-close-popup
        @click="TabsetService.closeAllTabs()">
        <q-item-section>&bull; Close all tabs ({{ useTabsStore2().browserTabs.length - 1 }})</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useUtils } from 'src/core/services/Utils'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import BackupAndCloseDialog from 'src/opentabs/dialogues/BackupAndCloseDialog.vue'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { ref, watch, watchEffect } from 'vue'

const settingsStore = useSettingsStore()
const $q = useQuasar()

const openTabsCountRatio = ref(0)
const openTabsCountRatio2 = ref(0)
const trackedTabsCount = ref(0)
const ignoredTabsCount = ref(0)
const existingSession = ref(false)

const { inBexMode } = useUtils()

const props = defineProps({
  showLabel: { type: Boolean, default: true },
  inSidePanel: { type: Boolean, default: false },
})

async function closeTrackedTabs(): Promise<chrome.tabs.Tab[]> {
  // TODO long-Running action
  const currentTab = await BrowserApi.getCurrentTab()

  const result: chrome.tabs.Tab[] = await chrome.tabs.query({})
  const tabsToClose: chrome.tabs.Tab[] = []
  const tabsToKeep: chrome.tabs.Tab[] = []
  _.forEach(result, (tab: chrome.tabs.Tab) => {
    if (tab && tab.url && tab.url !== currentTab.url && useTabsetService().tabsetsFor(tab.url).length > 0) {
      tabsToClose.push(tab)
    } else {
      tabsToKeep.push(tab)
    }
  })
  // console.log("tabsToClose", tabsToClose)
  _.forEach(tabsToClose, (t: chrome.tabs.Tab) => {
    if (t.id) {
      chrome.tabs.remove(t.id)
    }
  })
  return Promise.resolve(tabsToKeep)
}

async function trackedTabsCountFn(): Promise<number> {
  if (!chrome.tabs) {
    return Promise.resolve(0)
  }
  const result: chrome.tabs.Tab[] = await chrome.tabs.query({})
  let trackedTabs = 0
  _.forEach(result, (tab: chrome.tabs.Tab) => {
    if (tab && tab.url && useTabsetService().tabsetsFor(tab.url).length > 0) {
      trackedTabs++
    }
  })
  return trackedTabs
}

async function trackedIgnoredCountFn(): Promise<number> {
  return iterateOverIgnoredUrl(0, (tab: chrome.tabs.Tab, ignoredUrls: string[], counter: number) => {
    const url = new URL(tab.url!)
    const normalizedUrl = url.protocol + '//' + url.hostname + url.pathname
    if (ignoredUrls.indexOf(normalizedUrl) >= 0) {
      counter++
    }
    return counter
  })
}

trackedTabsCountFn().then((res) => (trackedTabsCount.value = res))
trackedIgnoredCountFn().then((res) => (ignoredTabsCount.value = res))

async function iterateOverIgnoredUrl(
  start: number,
  fkt: (t: chrome.tabs.Tab, ignoredUrls: string[], counter: number) => number,
): Promise<number> {
  if (!chrome.tabs) {
    return Promise.resolve(0)
  }
  const result: chrome.tabs.Tab[] = await chrome.tabs.query({})
  let trackedTabs = start
  const ignoredTabset = useTabsetsStore().getTabset('IGNORED')
  if (!ignoredTabset) {
    return start
  }
  for (const tab of result) {
    const ignoredUrls = ignoredTabset.tabs.map((t: Tab) => t.url).filter((url: string | undefined) => url !== undefined)
    if (!tab.url) {
      continue
    }
    try {
      trackedTabs = fkt(tab, ignoredUrls, trackedTabs)
    } catch (err) {
      console.log('error when interating over ignored URLS', err)
    }
  }
  return trackedTabs
}

async function closeIgnoredTabs() {
  return iterateOverIgnoredUrl(0, (tab: chrome.tabs.Tab, ignoredUrls: string[], counter: number) => {
    const url = new URL(tab.url!)
    const normalizedUrl = url.protocol + '//' + url.hostname + url.pathname
    if (ignoredUrls.indexOf(normalizedUrl) >= 0 && tab.id) {
      console.log('removing', tab.id, tab.url)
      chrome.tabs.remove(tab.id)
      counter++
    }
    return counter
  })
}

watchEffect(() => {
  openTabsCountRatio.value = Math.min(
    useTabsStore2().browserTabs.length / settingsStore.thresholds['max' as keyof object],
    1,
  )
  //console.log("threshold", settingsStore.thresholds['max' as keyof object])
  openTabsCountRatio2.value = Math.round(
    100 * Math.min(useTabsStore2().browserTabs.length / settingsStore.thresholds['max' as keyof object], 1),
  )
})

watch(
  () => useTabsStore2().browserTabs.length,
  (after: number, before: number) => {
    if (inBexMode()) {
      trackedTabsCountFn().then((res) => (trackedTabsCount.value = res))
      trackedIgnoredCountFn().then((res) => (ignoredTabsCount.value = res))
    }
  },
)

watch(
  () => useTabsetsStore().getCurrentTabs.length,
  (after: number, before: number) => {
    //console.log('---', after, before)
    if (inBexMode()) {
      trackedTabsCountFn().then((res) => (trackedTabsCount.value = res))
      trackedIgnoredCountFn().then((res) => (ignoredTabsCount.value = res))
    }
  },
)

const showThresholdBar = () => useTabsStore2().browserTabs.length >= settingsStore.thresholds['min' as keyof object]
const thresholdStyle = () => 'color: hsl(' + (120 - Math.round(120 * openTabsCountRatio.value)) + ' 80% 50%)'
const thresholdLabel = () => useTabsStore2().browserTabs.length + ' open tabs'

watchEffect(() => {
  existingSession.value =
    _.filter([...useTabsetsStore().tabsets.values()], (ts: Tabset) => ts.type === TabsetType.SESSION).length > 0
})

const backupAndClose = () => $q.dialog({ component: BackupAndCloseDialog })
</script>
