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
      <q-item clickable :disable="ignoredTabsCount === 0" v-close-popup @click="TabsetService.closeIgnoredTabs()">
        <q-item-section>&bull; Close {{ ignoredTabsCount }} ignored tabs</q-item-section>
      </q-item>
      <q-item
        :disable="useTabsetsStore().tabsets?.size === 0 || trackedTabsCount === 0"
        clickable
        v-close-popup
        @click="TabsetService.closeTrackedTabs()">
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
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useUtils } from 'src/core/services/Utils'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import BackupAndCloseDialog from 'src/opentabs/dialogues/BackupAndCloseDialog.vue'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import TabsetService from 'src/tabsets/services/TabsetService'
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

TabsetService.trackedTabsCount().then((res) => (trackedTabsCount.value = res))
TabsetService.trackedIgnoredCount().then((res) => (ignoredTabsCount.value = res))

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
      TabsetService.trackedTabsCount().then((res) => (trackedTabsCount.value = res))
      TabsetService.trackedIgnoredCount().then((res) => (ignoredTabsCount.value = res))
    }
  },
)

watch(
  () => useTabsetsStore().getCurrentTabs.length,
  (after: number, before: number) => {
    //console.log('---', after, before)
    if (inBexMode()) {
      TabsetService.trackedTabsCount().then((res) => (trackedTabsCount.value = res))
      TabsetService.trackedIgnoredCount().then((res) => (ignoredTabsCount.value = res))
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
