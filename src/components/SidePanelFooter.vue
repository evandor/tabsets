<template>

  <q-footer class="lightgrey text-primary q-pa-xs">
    <div class="row fit">
      <div class="col-7">
        <SidePanelFooterLeftButton
          v-if="useSettingsStore().isEnabled('dev')"
          :side-panel-view="SidePanelView.TABS_LIST" icon="o_playlist_add"
          tooltip="List all open tabs in your browser"/>
        <SidePanelFooterLeftButton :side-panel-view="SidePanelView.BOOKMARKS" icon="o_bookmark"
                                   tooltip="Show the Bookmarks Browser"/>
        <SidePanelFooterLeftButton :side-panel-view="SidePanelView.TAGS_LIST" icon="o_label"
                                   tooltip="List of all tags sorted by prevalence"/>
        <SidePanelFooterLeftButton :side-panel-view="SidePanelView.BY_DOMAIN_LIST" icon="o_dns"
                                   tooltip="List all your tabs URLs by domain"/>
        <SidePanelFooterLeftButton :side-panel-view="SidePanelView.RSS_LIST" icon="o_rss_feed"
                                   tooltip="List all your RSS feeds"/>
        <SidePanelFooterLeftButton :side-panel-view="SidePanelView.NEWEST_TABS_LIST" icon="o_schedule"
                                   tooltip="Newest Tabs List"/>
        <SidePanelFooterLeftButton :side-panel-view="SidePanelView.TOP_10_TABS_LIST" icon="o_workspace_premium"
                                   tooltip="Top 10 Tabs List"/>

        <span class="q-ma-none"
              v-if="permissionsStore.hasFeature(FeatureIdent.OPENTABS_THRESHOLD) && tabsStore.tabsets?.size > 0">
          <OpenTabsThresholdWidget :showLabel="false" :in-side-panel="true">
            <q-tooltip>{{ tabsStore.tabs?.length }} open tabs</q-tooltip>
          </OpenTabsThresholdWidget>
        </span>
      </div>
      <div class="col text-right">

        <q-btn icon="o_settings"
               :class="rightButtonClass()"
               color="primary"
               size="8px"
               @click="openOptionsPage()">
          <q-badge v-if="logsStore.errors.length > 0 && settingsStore.isEnabled('dev')"
                   color="red" floating>{{ logsStore.errors.length }}
          </q-badge>
          <q-badge v-if="logsStore.errors.length === 0 && logsStore.warnings.length > 0
                  && settingsStore.isEnabled('dev')"
                   color="orange" floating>{{ logsStore.warnings.length }}
          </q-badge>
          <q-tooltip class="tooltip" anchor="top left" self="bottom left">{{ settingsTooltip() }}</q-tooltip>
        </q-btn>

        <q-btn
          v-if="usePermissionsStore().hasFeature(FeatureIdent.STANDALONE_APP)"
          icon="o_open_in_new"
          :class="rightButtonClass()"
          color="primary"
          size="8px"
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
import SidePanelFooterLeftButton from "components/helper/SidePanelFooterLeftButton.vue";

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


const openExtensionTab = () => NavigationService.openOrCreateTab(chrome.runtime.getURL('www/index.html#/start'))

const settingsTooltip = () => {
  if (logsStore.errors.length > 0 && settingsStore.isEnabled('dev')) {
    return "Open Settings (" + logsStore.errors.length + " errors)"
  }
  if (logsStore.warnings.length > 0 && settingsStore.isEnabled('dev')) {
    return "Open Settings (" + logsStore.warnings.length + " warnings)"
  }
  return "Open Settings"
}

const rightButtonClass = () => "q-my-xs q-ml-xs q-px-xs q-mr-none"

</script>
