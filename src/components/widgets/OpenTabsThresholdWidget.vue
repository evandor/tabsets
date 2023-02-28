<template>

  <div class="cursor-pointer text-right" style="min-width:160px">
    <q-badge v-if="showThresholdBar()"
             :multi-line="false"
             class="q-mr-sm"
             color="primary" text-color="white" :label="thresholdLabel()">
    </q-badge>

    <q-circular-progress
      v-if="showThresholdBar()"
      show-value
      reverse
      :value="openTabsCountRatio2"
      size="20px"
      :thickness="0.7"
      :style="thresholdStyle()"
      track-color="grey-3"
      class="q-mr-lg">


    </q-circular-progress>
  </div>
  <q-menu :offset="[0, 15]">
    <q-list style="min-width: 200px">
      <q-item clickable v-close-popup @click="showOpenTabs">
        <q-item-section>Show open tabs</q-item-section>
      </q-item>
      <q-separator/>
      <q-item disable>
        Close some tabs:
      </q-item>
      <q-item
        :disable="tabsStore.tabsets?.size === 0 || trackedTabsCount === 0"
        clickable v-close-popup @click="TabsetService.closeTrackedTabs()">
        <q-item-section>&bull; Close all tracked tabs ({{ trackedTabsCount }})</q-item-section>
      </q-item>
      <!--      <q-item clickable v-close-popup @click="TabsetService.closeDuplictedOpenTabs()">-->
      <!--        <q-item-section>&bull; Close duplicated open tabs</q-item-section>-->
      <!--      </q-item>-->
      <q-item v-if="usePermissionsStore().hasFeature(FeatureIdent.BACKUP)"
              clickable v-close-popup
              @click="backupAndClose">
        <q-item-section>&bull; Backup and close current tabs...</q-item-section>
      </q-item>
      <q-item
        :disable="tabsStore.tabsets?.size === 0"
        clickable v-close-popup @click="TabsetService.closeAllTabs()">
        <q-item-section>&bull; Close all other tabs</q-item-section>
      </q-item>
      <q-separator/>
      <q-item disable v-if="showSpecialTabsets()">
        Use special tabsets:
      </q-item>
      <q-item v-if="usePermissionsStore().hasFeature(FeatureIdent.SESSIONS) && existingSession"
              clickable v-close-popup
              @click="replaceSession">
        <q-item-section>&bull; Replace existing Session...</q-item-section>
      </q-item>
      <q-item v-else-if="usePermissionsStore().hasFeature(FeatureIdent.SESSIONS) && !existingSession"
              clickable v-close-popup
              @click="startSession">
        <q-item-section>&bull; Start a new Session...</q-item-section>
      </q-item>
      <q-separator v-if="usePermissionsStore().hasFeature(FeatureIdent.SESSIONS)"/>
      <q-item v-if="usePermissionsStore().hasFeature(FeatureIdent.SESSIONS)"
        clickable v-close-popup @click="router.push('/settings')">
        <q-item-section>Change Settings</q-item-section>
      </q-item>
    </q-list>
  </q-menu>

</template>

<script lang="ts" setup>

import {useTabsStore} from "src/stores/tabsStore";
import {useSettingsStore} from "src/stores/settingsStore";
import TabsetService from "src/services/TabsetService"
import {ref, watch, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {useUiService} from "src/services/useUiService";
import {DrawerTabs} from "src/stores/uiStore";
import NewSessionDialog from "components/dialogues/NewSessionDialog.vue";
import {useQuasar} from "quasar";
import _ from "lodash"
import {Tabset, TabsetType} from "src/models/Tabset";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import BackupAndCloseDialog from "components/dialogues/BackupAndCloseDialog.vue";

const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()
const router = useRouter()
const $q = useQuasar()

const openTabsCountRatio = ref(0)
const openTabsCountRatio2 = ref(0)
const trackedTabsCount = ref(0)
const existingSession = ref(false)

TabsetService.trackedTabsCount().then((res) => trackedTabsCount.value = res)

watchEffect(() => {
  openTabsCountRatio.value = Math.min(tabsStore.tabs.length / settingsStore.thresholds['max' as keyof object], 1)
  openTabsCountRatio2.value = Math.round(100 * Math.min(tabsStore.tabs.length / settingsStore.thresholds['max' as keyof object], 1))
})

watch(() => tabsStore.tabs.length, (after: number, before: number) => {
  TabsetService.trackedTabsCount().then((res) => trackedTabsCount.value = res)
})

watch(() => tabsStore.getCurrentTabs.length, (after: number, before: number) => {
  TabsetService.trackedTabsCount().then((res) => trackedTabsCount.value = res)
})



// watch( useEventStore().events, (val: any) => {
//   console.log("event received", val)
//   TabsetService.trackedTabsCount().then((res) => trackedTabsCount.value = res)
// })

//watchEffect(() => TabsetService.trackedTabsCount().then((res) => trackedTabsCount.value = res))

const showThresholdBar = () =>
  tabsStore.tabs.length >= settingsStore.thresholds['min' as keyof object]

const thresholdStyle = () =>
  "color: hsl(" + (120 - Math.round(120 * openTabsCountRatio.value)) + " 80% 50%)"

const thresholdLabel = () => tabsStore.tabs.length + " open tabs"

const showOpenTabs = () =>
  useUiService().rightDrawerSetActiveTab(DrawerTabs.UNASSIGNED_TABS)

watchEffect(() => {
  existingSession.value = _.filter([...tabsStore.tabsets.values()], (ts: Tabset) => ts.type === TabsetType.SESSION).length > 0
})

const startSession = () => $q.dialog({component: NewSessionDialog, componentProps: {replaceSession: false}})
const replaceSession = () => $q.dialog({component: NewSessionDialog, componentProps: {replaceSession: true}})
const backupAndClose = () => $q.dialog({component: BackupAndCloseDialog})

const showSpecialTabsets = () => usePermissionsStore().hasFeature(FeatureIdent.SESSIONS)
</script>
