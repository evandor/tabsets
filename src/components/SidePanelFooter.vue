<template>

  <q-footer class="lightgrey text-primary q-pa-xs">
    <div class="row fit">
      <div class="col-7">
        <q-btn v-if="tabsStore.tabs?.length > 1"
               icon="o_playlist_add"
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
        <q-btn icon="o_rss_feed"
               v-if="permissionsStore.hasFeature(FeatureIdent.RSS)"
               class="q-my-xs q-ml-xs"
               style="width:20px"
               :color="isActive(SidePanelView.RSS_LIST) ? 'secondary':'primary'"
               size="8px"
               @click="toggleView(SidePanelView.RSS_LIST)">
          <q-tooltip class="tooltip">List all your RSS feeds</q-tooltip>
        </q-btn>
        <q-btn
          v-if="usePermissionsStore().hasFeature(FeatureIdent.NEWEST_TABS)"
          icon="o_schedule"
          class="q-my-xs q-ml-xs"
          style="width:20px"
          :color="isActive(SidePanelView.NEWEST_TABS_LIST) ? 'secondary':'primary'"
          size="8px"
          @click="toggleView(SidePanelView.NEWEST_TABS_LIST)">
          <q-tooltip class="tooltip">Newest Tabs List</q-tooltip>
        </q-btn>

        <q-btn
          v-if="usePermissionsStore().hasFeature(FeatureIdent.TOP10)"
          icon="o_workspace_premium"
          class="q-my-xs q-ml-xs"
          style="width:20px"
          :color="isActive(SidePanelView.TOP_10_TABS_LIST) ? 'secondary':'primary'"
          size="8px"
          @click="toggleView(SidePanelView.TOP_10_TABS_LIST)">
          <q-tooltip class="tooltip">Top 10 Tabs List</q-tooltip>
        </q-btn>

        <span class="q-ma-none"
              v-if="permissionsStore.hasFeature(FeatureIdent.OPENTABS_THRESHOLD) && tabsStore.tabsets?.size > 0">
          <OpenTabsThresholdWidget :showLabel="false" :in-side-panel="true">
            <q-tooltip>{{ tabsStore.tabs?.length }} open tabs</q-tooltip>
          </OpenTabsThresholdWidget>
        </span>
      </div>
      <div class="col text-right">

        <q-btn icon="o_settings"
               class="q-my-xs q-ml-xs q-mr-none"
               color="primary"
               size="8px"
               style="width:20px"
               @click="openOptionsPage()">
          <q-badge v-if="logsStore.errors.length > 0 && settingsStore.isEnabled('dev')"
            color="red" floating>{{logsStore.errors.length}}</q-badge>
          <q-badge v-if="logsStore.errors.length === 0 && logsStore.warnings.length > 0
                  && settingsStore.isEnabled('dev')"
                   color="orange" floating>{{logsStore.warnings.length}}</q-badge>
          <q-tooltip class="tooltip" anchor="top left" self="bottom left">{{ settingsTooltip() }}</q-tooltip>
        </q-btn>

        <q-btn
          v-if="usePermissionsStore().hasFeature(FeatureIdent.STANDALONE_APP)"
          icon="o_open_in_new"
          class="q-my-xs q-ml-xs q-mr-none"
          color="primary"
          size="8px"
          style="width:20px"
          @click="openExtensionTab()">
          <q-tooltip class="tooltip">Tabsets as full-page app</q-tooltip>
        </q-btn>

      </div>
    </div>

  </q-footer>
</template>
<script setup lang="ts">
import {SidePanelView, useUiStore} from "src/stores/uiStore";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import OpenTabsThresholdWidget from "components/widgets/OpenTabsThresholdWidget.vue";
import NavigationService from "src/services/NavigationService";
import {useLogsStore} from "stores/logsStore";
import {useSettingsStore} from "stores/settingsStore";

const tabsStore = useTabsStore()
const logsStore = useLogsStore()
const settingsStore = useSettingsStore()

const permissionsStore = usePermissionsStore()
const router = useRouter()

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  currentChromeTab.value = useTabsStore().currentChromeTab
})

const openOptionsPage = () => window.open(chrome.runtime.getURL('www/index.html#/mainpanel/settings'));


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

const openExtensionTab = () => NavigationService.openOrCreateTab(chrome.runtime.getURL('www/index.html#/start'))

const settingsTooltip = () => {
  if (logsStore.errors.length > 0  && settingsStore.isEnabled('dev')) {
    return "Open Settings (" + logsStore.errors.length + " errors)"
  }
  if (logsStore.warnings.length > 0  && settingsStore.isEnabled('dev')) {
    return "Open Settings (" + logsStore.warnings.length + " warnings)"
  }
  return "Open Settings"
}

</script>
