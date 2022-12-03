<template>

  <div class="cursor-pointer">
    <q-badge
             class="q-mr-sm"
             color="primary" text-color="white" :label="thresholdLabel()">
    </q-badge>

    <q-circular-progress
      show-value
      reverse
      :value="openTabsCountRatio"
      size="20px"
      :thickness="0.7"
      :style="thresholdStyle()"
      track-color="grey-3"
      class="q-mr-lg">


    </q-circular-progress>
  </div>
  <q-menu :offset="[0, 15]">
    <q-list style="min-width: 200px">
      <q-item disable>
        {{ searchStore.getIndex().size() }} (of {{ tabsStore.allTabsCount }}) tabs are indexed for search
      </q-item>
      <q-item disable>
        (Re-)Index some tabs:
      </q-item>
      <q-item
        :disable="tabsStore.tabsets?.size === 0"
        clickable v-close-popup @click="TabsetService.closeTrackedTabs()">
        <q-item-section>&bull; Reindex this tabset's tabs</q-item-section>
      </q-item>
      <q-item
        :disable="tabsStore.tabsets?.size === 0"
        clickable v-close-popup @click="TabsetService.closeTrackedTabs()">
        <q-item-section>&bull; Reindex all tabs</q-item-section>
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
import {useSearchStore} from "stores/searchStore";

const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()
const searchStore = useSearchStore()
const router = useRouter()

const openTabsCountRatio = ref(0)

watchEffect(() => {
  openTabsCountRatio.value = 100 * Math.min(searchStore.getIndex().size() / (tabsStore.allTabsCount === 0 ? 1 : tabsStore.allTabsCount), 1)
})

const thresholdStyle = () => {
  // console.log("r1", openTabsCountRatio.value)
  // console.log("r2", 1.2 * Math.round(openTabsCountRatio.value))
  // console.log("r3", 1.2 * Math.round(openTabsCountRatio.value) - 120)
  return "color: hsl(" + (1.2 * Math.round(openTabsCountRatio.value)) + " 80% 50%)"
}

// @ts-ignore
const thresholdLabel = () => searchStore.getIndex().size() + " tabs indexed"


</script>
