<template>

  <q-footer class="bg-white q-pa-xs q-mt-sm" style="border-top: 1px solid lightgrey">
    <div class="row fit">
      <div class="col-8">

        <template v-if="showSuggestionButton">
          <q-btn
              outline
              icon="o_lightbulb"
              :label="suggestionsLabel()"
              :color="dependingOnStates()"
              @click="suggestionDialog()"
              class="q-ma-none q-pa-xs q-ml-sm q-mt-xs q-pr-md cursor-pointer"
              size="10px">
          </q-btn>

        </template>

        <template v-else>

          <q-btn v-if="showSuggestionIcon"
                 @click="doShowSuggestionButton = true"
                 icon="o_lightbulb"
                 class="q-my-xs q-ml-xs q-px-xs"
                 flat
                 color="warning"
                 size="9px">
            <q-tooltip class="tooltip">{{ suggestionsLabel() }}</q-tooltip>
          </q-btn>

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

        </template>

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
      <div class="col text-right text-black">
        <q-btn icon="o_help" v-if="usePermissionsStore().hasFeature(FeatureIdent.HELP)"
               :class="rightButtonClass()"
               flat
               color="black"
               size="8px"
               @click="openHelpView()">
        </q-btn>

        <q-btn icon="o_settings"
               :class="rightButtonClass()"
               flat
               color="black"
               size="8px"
               @click="openOptionsPage()">
          <q-tooltip class="tooltip" anchor="top left" self="bottom left">{{ settingsTooltip() }}</q-tooltip>
        </q-btn>

        <q-btn
            v-if="usePermissionsStore().hasFeature(FeatureIdent.STANDALONE_APP)"
            icon="o_open_in_new"
            :class="rightButtonClass()"
            flat
            color="black"
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
import {useSettingsStore} from "stores/settingsStore";
import SidePanelFooterLeftButton from "components/helper/SidePanelFooterLeftButton.vue";
import {Notify, useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {useWindowsStore} from "stores/windowsStores";
import {useSuggestionsStore} from "stores/suggestionsStore";
import _ from "lodash";
import {SuggestionState, SuggestionType} from "src/models/Suggestion";
import SuggestionDialog from "components/dialogues/SuggestionDialog.vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {DeactivateFeatureCommand} from "src/domain/features/DeactivateFeature";
import {AppFeatures} from "src/models/AppFeatures";
import {TabsetStatus} from "src/models/Tabset";
import {useTabsetService} from "src/services/TabsetService2";
import {useSearchStore} from "stores/searchStore";

const {inBexMode, sanitize, sendMsg} = useUtils()

const $q = useQuasar()

const tabsStore = useTabsStore()
const permissionsStore = usePermissionsStore()
const router = useRouter()
const uiStore = useUiStore()

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const progress = ref<number | undefined>(undefined)
const progressLabel = ref<string | undefined>(undefined)
const showSuggestionButton = ref(false)
const showSuggestionIcon = ref(false)
const doShowSuggestionButton = ref(false)

watchEffect(() => {
  showSuggestionButton.value =
      doShowSuggestionButton.value ||
      (useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
          _.findIndex(useSuggestionsStore().getSuggestions(), s => {
            if (s.state === SuggestionState.APPLIED || s.state === SuggestionState.IGNORED) {
              return false
            }
            if (!usePermissionsStore().hasFeature(FeatureIdent.RSS)) {
              return (s.state === SuggestionState.NEW)
                  && s.type !== SuggestionType.RSS
            }
            return s.state === SuggestionState.NEW
          }) >= 0)

  showSuggestionIcon.value =
      !doShowSuggestionButton.value &&
      useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
      _.findIndex(useSuggestionsStore().getSuggestions(), s => {
        if (s.state === SuggestionState.APPLIED || s.state === SuggestionState.IGNORED) {
          return false
        }
        if (!usePermissionsStore().hasFeature(FeatureIdent.RSS)) {
          return (s.state === SuggestionState.CANCELED)
              && s.type !== SuggestionType.RSS
        }
        return s.state === SuggestionState.CANCELED
      }) >= 0
})

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  if (!inBexMode()) {
    return
  }
  const windowId = useWindowsStore().currentWindow.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
})

watchEffect(() => {
  progress.value = (uiStore.progress || 0.0) / 100.0
  progressLabel.value = uiStore.progressLabel + " " + Math.round(100 * progress.value) + "%"
})

//const openOptionsPage = () => window.open(chrome.runtime.getURL('www/index.html#/mainpanel/settings'));
const openOptionsPage = () => window.open('#/mainpanel/settings');

const openExtensionTab = () => NavigationService.openOrCreateTab(chrome.runtime.getURL('www/index.html#/fullpage'))

const settingsTooltip = () => {
  return "Open Settings of Tabsets " + import.meta.env.PACKAGE_VERSION
}

const rightButtonClass = () => "q-my-xs q-ml-xs q-px-xs q-mr-none"

const dependingOnStates = () =>
    _.find(useSuggestionsStore().getSuggestions(), s => s.state === SuggestionState.NEW) ? 'warning' : 'primary'

const suggestionDialog = () => {
  doShowSuggestionButton.value = false
  $q.dialog({
    component: SuggestionDialog, componentProps: {
      suggestion: useSuggestionsStore().getSuggestions().at(0),
      fromPanel: true
    }
  })
}
const suggestionsLabel = () => {
  const suggestions = useSuggestionsStore().getSuggestions()
  return suggestions.length === 1 ?
      suggestions.length + " New Suggestion" :
      suggestions.length + " New Suggestions"

}

  // function deactivateHelpFeature() {
  //   const helpFeature = new AppFeatures().getFeature(FeatureIdent.HELP)
  //   if (helpFeature) {
  //     useCommandExecutor().execute(new DeactivateFeatureCommand(helpFeature))
  //         .then((res) => {
  //           useTabsetService().deleteTabset("HELP")
  //           Notify.create({
  //             color: 'warning',
  //             message: "The Help pages have been deleted"
  //           })
  //         })
  //         .catch((err) => {
  //           console.log("error deactivating help", err)
  //           Notify.create({
  //             color: 'warning',
  //             message: "There was a problem"
  //           })
  //         })
  //   }
  // }

const openHelpView = () => {
  const helpTabset = useTabsStore().getTabset("HELP")
  console.log("got helpTabset", helpTabset)
  if (helpTabset && helpTabset.status !== TabsetStatus.DELETED) {
    router.push("/sidepanel/tabsets/HELP")
  } else {
    //deactivateHelpFeature();
  }
}

</script>
