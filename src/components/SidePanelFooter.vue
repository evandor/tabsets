<template>

  <q-footer class="lightgrey text-primary q-pa-xs">
    <div class="row fit">
      <div class="col-6">
        <q-btn icon="o_playlist_add"
               class="q-my-xs q-ml-xs"
               style="width:20px"
               :color="isActive(SidePanelView.TABS_LIST) ? 'secondary':'primary'"
               size="8px"
               @click="toggleView(SidePanelView.TABS_LIST)">
          <q-tooltip class="tooltip">List all open tabs in your browser</q-tooltip>
        </q-btn>
        <q-btn icon="o_label"
               v-if="permissionsStore.hasFeature(FeatureIdent.TAGS)"
               class="q-my-xs q-ml-xs"
               style="width:20px"
               :color="isActive(SidePanelView.TAGS_LIST) ? 'secondary':'primary'"
               size="8px"
               @click="toggleView(SidePanelView.TAGS_LIST)">
          <q-tooltip class="tooltip">List of all tags sorted by prevalence</q-tooltip>
        </q-btn>
        <q-btn icon="o_dns"
               v-if="permissionsStore.hasFeature(FeatureIdent.GROUP_BY_DOMAIN)"
               class="q-my-xs q-ml-xs"
               style="width:20px"
               :color="isActive(SidePanelView.BY_DOMAIN_LIST) ? 'secondary':'primary'"
               size="8px"
               @click="toggleView(SidePanelView.BY_DOMAIN_LIST)">
          <q-tooltip class="tooltip">List all your tabs URLs by domain</q-tooltip>
        </q-btn>
        <span class="q-ma-none" v-if="permissionsStore.hasFeature(FeatureIdent.OPENTABS_THRESHOLD) && tabsStore.tabsets.size > 0">
          <OpenTabsThresholdWidget :showLabel="false" :in-side-panel="true">
            <q-tooltip>{{tabsStore.tabs.length}} open tabs</q-tooltip>
          </OpenTabsThresholdWidget>
        </span>
      </div>
      <div class="col text-right">
        <q-btn icon="crop_7_5"
               class="q-my-xs q-mx-none"
               style="width:20px"
               color="primary"
               :outline="useUiStore().listDetailLevel !== ListDetailLevel.SMALL" size="8px"
               @click="setListDetailLevel(ListDetailLevel.SMALL)">
          <q-tooltip class="tooltip">Show only title and url</q-tooltip>
        </q-btn>
        <q-btn icon="crop_16_9"
               class="q-my-xs q-mx-none"
               style="width:20px"
               color="primary"
               :outline="useUiStore().listDetailLevel !== ListDetailLevel.MEDIUM" size="8px"
               @click="setListDetailLevel(ListDetailLevel.MEDIUM)">
          <q-tooltip class="tooltip">Show image, title and url</q-tooltip>
        </q-btn>
        <q-btn icon="crop_portrait"
               class="q-my-xs q-mx-none"
               style="width:20px"
               color="primary"
               :outline="useUiStore().listDetailLevel !== ListDetailLevel.LARGE" size="8px"
               @click="setListDetailLevel(ListDetailLevel.LARGE)">
          <q-tooltip class="tooltip">All available info</q-tooltip>
        </q-btn>

        <q-btn icon="o_settings"
               class="q-my-xs q-mx-xs"
               color="primary"
               size="8px"
               style="width:20px"
               @click="openOptionsPage()">
          <q-tooltip class="tooltip" anchor="top left" self="bottom left">Open Settings</q-tooltip>
        </q-btn>
      </div>
    </div>

  </q-footer>
</template>
<script setup lang="ts">
import {ListDetailLevel, SidePanelView, useUiStore} from "stores/uiStore";
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import OpenTabsThresholdWidget from "components/widgets/OpenTabsThresholdWidget.vue";

const tabsStore = useTabsStore()
const permissionsStore = usePermissionsStore()
const router = useRouter()

const activeView = ref<string | undefined>(undefined)
const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)

const setListDetailLevel = (val: ListDetailLevel) => useUiStore().setListDetailLevel(val)

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  console.log("tabset id", useTabsStore().currentTabsetId)
})
watchEffect(() => {
  currentChromeTab.value = useTabsStore().currentChromeTab
})

const openOptionsPage = () => {
  // if (chrome.runtime.openOptionsPage) {
  //   chrome.runtime.openOptionsPage();
  // } else {
  //   window.open(chrome.runtime.getURL('www/options.html'));
  // }
  window.open(chrome.runtime.getURL('www/index.html#/mainpanel/settings'));
}

const toggleView = (view: SidePanelView) => {
  if (isActive(view)) {
    activateView(SidePanelView.MAIN)
    router.push("/sidepanel")
  } else {
    activateView(view)
    router.push("/sidepanel/" + view)
  }
}

const isActive = (view: SidePanelView) => useUiStore().sidePanelIsActive(view)
const activateView = (view: SidePanelView) => useUiStore().sidePanelSetActiveView(view)

</script>
