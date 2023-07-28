<template>

  <q-footer class="bg-white q-pa-xs q-mt-sm" style="border-top: 1px solid lightgrey">
    <div class="row fit">
      <div class="col-9">
        <SidePanelFooterLeftButton
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

        <template v-if="progress">
          <q-linear-progress size="20px" :value="progress" color="primary">
            <div class="absolute-full flex flex-center">
              <q-badge color="white" text-color="accent" :label="progressLabel"/>
            </div>
          </q-linear-progress>
        </template>
        <template v-else>
<!--          <q-input borderless v-if="!progress && usePermissionsStore().hasFeature(FeatureIdent.NOTES)"-->
<!--                   class="q-ma-xs"-->
<!--                   style="height:20px;border: 1px dotted lightgray; border-radius: 3px;" v-model="dragTarget"/>-->
        </template>

      </div>
      <div class="col text-right">

        <q-btn icon="o_settings"
               :class="rightButtonClass()"
               color="primary"
               size="8px"
               @click="openOptionsPage()">
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
import {Tab, UrlExtension} from "src/models/Tab";
import {ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import OpenTabsThresholdWidget from "components/widgets/OpenTabsThresholdWidget.vue";
import NavigationService from "src/services/NavigationService";
import {useLogsStore} from "stores/logsStore";
import {useSettingsStore} from "stores/settingsStore";
import SidePanelFooterLeftButton from "components/helper/SidePanelFooterLeftButton.vue";
import {date, QInput, uid} from "quasar";
import AddUrlDialog from "components/dialogues/AddUrlDialog.vue";
import ChromeApi from "src/services/ChromeApi";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import {useUtils} from "src/services/Utils";
import {useWindowsStore} from "stores/windowsStores";

const {inBexMode, sanitize, sendMsg} = useUtils()

const tabsStore = useTabsStore()
const logsStore = useLogsStore()
const settingsStore = useSettingsStore()

const permissionsStore = usePermissionsStore()
const router = useRouter()
const uiStore = useUiStore()

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const progress = ref<number | undefined>(undefined)
const progressLabel = ref<string | undefined>(undefined)
const dragTarget = ref('')

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  //currentChromeTab.value = useTabsStore().currentChromeTab
  const windowId = useWindowsStore().currentWindow.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
})

watchEffect(() => {
  progress.value = (uiStore.progress || 0.0) / 100.0
  progressLabel.value = uiStore.progressLabel + " " + Math.round(100 * progress.value) + "%"
})

watchEffect(() => {
  if (dragTarget.value.trim() === "") {
    return
  }
  try {
    const url = new URL(dragTarget.value)
    $q.dialog({component: AddUrlDialog, componentProps: {providedUrl: url.toString()}})
  } catch (err) {
    // not an url, create a "fake" url and save as note
    if (tabsStore.getCurrentTabset) {
      const id = uid()
      const url = chrome.runtime.getURL('www/index.html') + "#/mainpanel/notes/" + id
      const text = sanitize(dragTarget.value.trim())

      const titleCandidate = text.split(".")[0]
      let title = "note " + date.formatDate(new Date().getTime(), 'DD.MM.YYYY HH:mm')
      // console.log("titleCandidate", titleCandidate.length, titleCandidate)
      // if (titleCandidate.length > 0 && titleCandidate.length < 60) {
      //   title = titleCandidate
      // }

      const chromeTab = ChromeApi.createChromeTabObject(title, url,
        "https://img.icons8.com/?size=512&id=86843&format=png")
      const tab = new Tab(id, chromeTab)
      tab.description = text

      if (inBexMode()) {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, (openTabs) => {
          if (openTabs.length > 0) {
            const currentChromeTab = openTabs[0]
            tab.favIconUrl = current.favIconUrl
            if (current.url) {
              tab.history.push(current.url)
            }
            tab.tags.push("Note")
            tab.extension = UrlExtension.NOTE
            //tab.description =  tab.description + openTabs[0].url + "\n\n"
          }
          // @ts-ignore
          useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(tab, tabsStore.getCurrentTabset))
        })
      } else {
        useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(tab, tabsStore.getCurrentTabset))
      }

    } else {
      console.log("no current tabset")
    }
  }
  dragTarget.value = ''
})


const openOptionsPage = () => window.open(chrome.runtime.getURL('www/index.html#/mainpanel/settings'));


const openExtensionTab = () => NavigationService.openOrCreateTab(chrome.runtime.getURL('www/index.html#/start'))

const settingsTooltip = () => {
  return "Open Settings of Tabsets " +  import.meta.env.PACKAGE_VERSION
}

const rightButtonClass = () => "q-my-xs q-ml-xs q-px-xs q-mr-none"


</script>
