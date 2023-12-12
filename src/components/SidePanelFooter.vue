<template>

  <q-footer class="bg-white q-pa-xs q-mt-sm" style="border-top: 1px solid lightgrey">
    <div class="row fit q-mb-xs"
         style="border-bottom: 1px dotted #bfbfbf"
         v-if="otherActiveWindows().length > 0">
      <div class="col-12 text-black">
        <q-icon name="o_grid_view" color="blue">
          <q-tooltip class="tooltip-small">Other Browser Windows</q-tooltip>
        </q-icon>
        <q-btn v-for="w in otherActiveWindows()" dense
               flat
               size="xs" class="q-ma-sm"
               text-color="blue-8"
               @click="openWindow(w.id)"
               :label="w.name">
          <q-tooltip class="tooltip-small">Switch to window '{{ w.name }}'</q-tooltip>
        </q-btn>
      </div>

    </div>
    <div class="row fit">
      <div class="col-9">

        <Transition name="fade" appear>
          <q-banner
              v-if="checkToasts()"
              inline-actions dense rounded
              style="font-size: smaller;text-align: center"
              :class="toastBannerClass()">
            {{ useUiStore().toasts[0]?.msg }}
            <template v-slot:action v-if="useUiStore().toasts[0]?.action">
              <q-btn flat label="Undo"
                     @click="useUiStore().callUndoActionFromCurrentToast()"/>
            </template>
          </q-banner>
        </Transition>

        <q-btn v-if="!checkToasts() && !transitionGraceTime && showSuggestionButton"
               outline
               icon="o_lightbulb"
               :label="suggestionsLabel()"
               :color="dependingOnStates()"
               :size="getButtonSize()"
               @click="suggestionDialog()"
               class="q-ma-none q-pa-xs q-ml-sm q-mt-xs q-pr-md cursor-pointer">
        </q-btn>

        <template v-if="!checkToasts() && !transitionGraceTime && !showSuggestionButton">

          <SidePanelFooterLeftButtons
              @was-clicked="doShowSuggestionButton = true"
              :show-suggestion-icon="showSuggestionIcon"/>

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
               :size="getButtonSize()"
               @click="openHelpView()">
        </q-btn>

        <q-btn icon="o_settings"
               :class="rightButtonClass()"
               flat
               color="black"
               :size="getButtonSize()"
               @click="openOptionsPage()">
          <q-tooltip class="tooltip" anchor="top left" self="bottom left">{{ settingsTooltip() }}</q-tooltip>
        </q-btn>

        <q-btn
            v-if="usePermissionsStore().hasFeature(FeatureIdent.STANDALONE_APP)"
            icon="o_open_in_new"
            :class="rightButtonClass()"
            flat
            color="black"
            :size="getButtonSize()"
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
import NavigationService from "src/services/NavigationService";
import {useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {useWindowsStore} from "src/stores/windowsStore";
import {useSuggestionsStore} from "stores/suggestionsStore";
import _ from "lodash";
import {SuggestionState} from "src/models/Suggestion";
import SuggestionDialog from "components/dialogues/SuggestionDialog.vue";
import {TabsetStatus} from "src/models/Tabset";
import {ToastType} from "src/models/Toast";
import SidePanelFooterLeftButtons from "components/helper/SidePanelFooterLeftButtons.vue";

const {inBexMode} = useUtils()

const $q = useQuasar()

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
const transitionGraceTime = ref(false)

watchEffect(() => {
  const suggestions = useSuggestionsStore().getSuggestions(
      [SuggestionState.NEW, SuggestionState.DECISION_DELAYED, SuggestionState.NOTIFICATION])
  //console.log("watcheffect for", suggestions)
  showSuggestionButton.value =
      doShowSuggestionButton.value ||
      (useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
          _.findIndex(suggestions, s => {
            return s.state === SuggestionState.NEW ||
                (s.state === SuggestionState.NOTIFICATION && !usePermissionsStore().hasFeature(FeatureIdent.NOTIFICATIONS))
          }) >= 0)

  showSuggestionIcon.value =
      !doShowSuggestionButton.value &&
      useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
      _.findIndex(suggestions, s => {
        return s.state === SuggestionState.DECISION_DELAYED
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
  const windowId = useWindowsStore().currentWindow?.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
})

watchEffect(() => {
  progress.value = (uiStore.progress || 0.0) / 100.0
  progressLabel.value = uiStore.progressLabel + " " + Math.round(100 * progress.value) + "%"
})

//const openOptionsPage = () => window.open(chrome.runtime.getURL('www/index.html#/mainpanel/settings'));
const openOptionsPage = () => window.open('#/mainpanel/settings');

const openExtensionTab = () => NavigationService.openOrCreateTab([chrome.runtime.getURL('www/index.html#/fullpage')])

const settingsTooltip = () => {
  return "Open Settings of Tabsets " + import.meta.env.PACKAGE_VERSION
}

const rightButtonClass = () => "q-my-xs q-px-xs q-mr-none"

const dependingOnStates = () =>
    _.find(useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED]), s => s.state === SuggestionState.NEW) ? 'warning' : 'primary'

const suggestionDialog = () => {
  doShowSuggestionButton.value = false
  $q.dialog({
    component: SuggestionDialog, componentProps: {
      suggestion: useSuggestionsStore()
          .getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED, SuggestionState.NOTIFICATION]).at(0),
      fromPanel: true
    }
  })
}
const suggestionsLabel = () => {
  const suggestions = useSuggestionsStore().getSuggestions(
      [SuggestionState.NEW, SuggestionState.DECISION_DELAYED, SuggestionState.NOTIFICATION])
  return suggestions.length === 1 ?
      suggestions.length + " New Suggestion" :
      suggestions.length + " New Suggestions"

}

const openHelpView = () => {
  const helpTabset = useTabsStore().getTabset("HELP")
  console.log("got helpTabset", helpTabset)
  if (helpTabset && helpTabset.status !== TabsetStatus.DELETED) {
    router.push("/sidepanel/tabsets/HELP")
  } else {
    //deactivateHelpFeature();
  }
}

const checkToasts = () => {
  if (useUiStore().toasts.length > 0) {
    const useDelay = 3000
    useUiStore().delayedToastRemoval(useDelay)
    const oldShowButton = showSuggestionButton.value
    const oldDoShowButton = doShowSuggestionButton.value
    transitionGraceTime.value = true
    showSuggestionButton.value = false
    doShowSuggestionButton.value = false
    setTimeout(() => {
      if (useUiStore().toasts.length === 0) { // only if all toasts are gone
        transitionGraceTime.value = false
        showSuggestionButton.value = oldShowButton
        doShowSuggestionButton.value = oldDoShowButton
      }
    }, useDelay + 1100) // must be higher than css value in fade-leave-active

    return true
  }
  return false
}

const getButtonSize = () => useUiStore().getButtonSize('sidePanelFooter')

const toastBannerClass = () => {
  const defaults = " text-white q-py-none"
  switch (useUiStore().toasts[0]?.type) {
    case ToastType.INFO:
      return "bg-positive" + defaults
    case ToastType.WARNING:
      return "bg-warning" + defaults
    case ToastType.ERROR:
      return "bg-negative" + defaults
    default:
      return "bg-negative" + defaults
  }
}

const otherActiveWindows = () => {
  return _.filter(
      _.sortBy(
          _.map(
              _.filter(useWindowsStore().currentWindows, (w: chrome.windows.Window) => {
                return useWindowsStore().currentWindow?.id !== w.id
              }), w => {
                return w.id ? {
                  name: useWindowsStore().windowNameFor(w.id) || 'Main',
                  id: w.id
                } : {name: 'unknown', id: 0}
              }),
          o => o.name),
      (e: object) => e['name' as keyof object] !== '%monitoring%')
}

const openWindow = (windowId: number) =>
    chrome.windows.update(windowId, {drawAttention: true, focused: true},
        (callback) => {})

const displayFlat = (w: any): boolean => {
  let currentWindowName = useWindowsStore().currentWindowName || 'Main'
  //console.log("===", w, currentWindowName)
  return w.name === currentWindowName
}

</script>

<style>
.fade-enter-active {
  transition: opacity 0.5s ease;
}

.fade-leave-active {
  transition: opacity 1.0s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
