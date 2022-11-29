<template>

  <div class="cursor-pointer">
    <q-badge v-if="showThresholdBar()"
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
        :disable="tabsStore.tabsets?.size === 0"
        clickable v-close-popup @click="TabsetService.closeTrackedTabs()">
        <q-item-section>&bull; Close all tracked tabs</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="TabsetService.closeDuplictedOpenTabs()">
        <q-item-section>&bull; Close duplicated open tabs</q-item-section>
      </q-item>
      <q-separator/>
      <q-item clickable v-close-popup @click="router.push('/settings')">
        <q-item-section>Change Settings</q-item-section>
      </q-item>
    </q-list>
  </q-menu>

</template>

<script lang="ts" setup>

import {useTabsStore} from "stores/tabsStore";
import {useSettingsStore} from "stores/settingsStore";
import TabsetService from "src/services/TabsetService"
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {useNotificationsStore} from "stores/notificationsStore";

const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()
const router = useRouter()

const openTabsCountRatio = ref(0)
const openTabsCountRatio2 = ref(0)

watchEffect(() => {
  openTabsCountRatio.value = Math.min(tabsStore.tabs.length / settingsStore.thresholds['max' as keyof object], 1)
  openTabsCountRatio2.value = Math.round(100 * Math.min(tabsStore.tabs.length / settingsStore.thresholds['max' as keyof object], 1))
})

const showThresholdBar = () =>
  tabsStore.tabs.length >= settingsStore.thresholds['min' as keyof object]

const thresholdStyle = () =>
  "color: hsl(" + (120 - Math.round(120 * openTabsCountRatio.value)) + " 80% 50%)"

const thresholdLabel = () => tabsStore.tabs.length + " open tabs"

const showOpenTabs = () => {
  useNotificationsStore().showDrawer = true
  useNotificationsStore().showOpenTabs = true
}

</script>
