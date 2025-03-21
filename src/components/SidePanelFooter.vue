<template>
  <q-footer
    class="q-pa-none q-mt-sm darkInDarkMode brightInBrightMode"
    style="border-top: 1px solid lightgrey"
    :style="offsetBottom()">
    <template v-if="checkToasts()">
      <Transition name="fade" appear>
        <q-banner
          inline-actions
          dense
          rounded
          style="font-size: smaller; text-align: center"
          :class="toastBannerClass()">
          {{ useUiStore().toasts[0]?.msg }}
          <template v-slot:action v-if="useUiStore().toasts[0]?.actions[0]">
            <q-btn
              flat
              :label="useUiStore().toasts[0]!.actions[0].label"
              @click="useUiStore().callUndoActionFromCurrentToast()" />
          </template>
        </q-banner>
      </Transition>
    </template>

    <template v-if="useFeaturesStore().hasFeature(FeatureIdent.TABSET_LIST)">
      <SidePanelTabsetListMarkup />
    </template>

    <SidePanelMessagesMarkup />

    <div class="row fit q-mb-sm" v-if="showWindowTable">
      <!-- https://michaelnthiessen.com/force-re-render -->

      <!-- all windows related logic here: -->
      <WindowsMarkupTable />
    </div>

    <div class="row fit q-mb-sm" v-if="showStatsTable">
      <SidePanelStatsMarkupTable :key="randomKey" />
    </div>

    <div class="row fit q-ma-none q-pa-none" v-if="!checkToasts() && useUiStore().progress">
      <div class="col-12">
        <q-linear-progress stripe size="18px" :value="progressValue" color="grey-7" track-color="grey-4">
          <div class="absolute-full flex flex-center">
            <q-badge :label="progressLabel" color="grey" />
          </div>
        </q-linear-progress>
      </div>
    </div>

    <div class="row fit q-ma-none q-pa-none">
      <div class="col-6">
        <q-btn
          v-if="showSuggestionButton"
          outline
          icon="o_lightbulb"
          :label="suggestionsLabel()"
          :color="dependingOnStates()"
          size="sm"
          @click="suggestionDialog()"
          class="q-ma-none q-pa-xs q-ml-sm q-mt-xs q-pr-md cursor-pointer">
        </q-btn>

        <template v-else>
          <SidePanelFooterLeftButtons
            @was-clicked="doShowSuggestionButton = true"
            :size="getButtonSize()"
            :show-suggestion-icon="showSuggestionIcon" />
        </template>
      </div>
      <div class="col text-right" v-if="useUiStore().appLoading">&nbsp;</div>
      <div v-else class="col text-right">
        <span>
          <input
            class="q-ma-none q-pa-none"
            v-if="useFeaturesStore().hasFeature(FeatureIdent.HTML_SNIPPETS) && useContentStore().getCurrentTabUrl"
            v-model="ignored"
            style="border: 1px dotted grey; border-radius: 3px; max-width: 30px; max-height: 20px"
            @drop="drop($event)" />
          <q-tooltip class="tooltip_small">Drag and drop text or images from your current tab</q-tooltip>
        </span>

        <q-btn
          v-if="useFeaturesStore().hasFeature(FeatureIdent.WINDOWS_MANAGEMENT)"
          icon="o_grid_view"
          data-testid="buttonManageWindows"
          :class="rightButtonClass()"
          flat
          :size="getButtonSize()"
          @click="toggleShowWindowTable()">
          <q-tooltip class="tooltip_small" anchor="top left" self="bottom left">Manage Windows</q-tooltip>
        </q-btn>

        <q-btn
          v-if="useFeaturesStore().hasFeature(FeatureIdent.STATS)"
          icon="show_chart"
          :class="rightButtonClass()"
          flat
          :size="getButtonSize()"
          @click="toggleShowStatsTable()">
          <q-tooltip class="tooltip_small" anchor="top left" self="bottom left">Show Stats</q-tooltip>
        </q-btn>

        <q-btn
          v-if="useFeaturesStore().hasFeature(FeatureIdent.STANDALONE_APP)"
          icon="o_open_in_new"
          :class="rightButtonClass()"
          flat
          :size="getButtonSize()"
          @click="openExtensionTab()">
          <q-tooltip class="tooltip_small" anchor="top left" self="bottom left">Tabsets as full-page app</q-tooltip>
        </q-btn>

        <span>
          <q-btn
            icon="o_settings"
            v-if="showSettingsButton()"
            class="q-my-xs q-px-xs q-mr-none"
            :class="{ shake: animateSettingsButton }"
            flat
            :size="getButtonSize()">
            <q-tooltip :delay="4000" class="tooltip_small" anchor="top left" self="bottom left">{{
              settingsTooltip()
            }}</q-tooltip>
          </q-btn>
          <q-menu :offset="[-10, 0]">
            <q-list dense style="min-width: 180px">
              <ContextMenuItem v-close-popup @was-clicked="openOptionsPage()" icon="o_settings" label="Open Settings" />

              <q-separator />

              <ContextMenuItem
                v-close-popup
                @was-clicked="openURL('https://docs.tabsets.net')"
                icon="o_open_in_new"
                label="Documentation" />

              <ContextMenuItem
                v-close-popup
                @was-clicked="
                  openURL(
                    'https://docs.google.com/forms/d/e/1FAIpQLSdUtiKIyhqmNoNkXXzZOEhnzTCXRKT-Ju83SyyEovnfx1Mapw/viewform?usp=pp_url',
                  )
                "
                icon="o_open_in_new"
                label="Feedback" />

              <ContextMenuItem
                v-close-popup
                @was-clicked="openURL('https://github.com/evandor/tabsets/issues')"
                icon="o_open_in_new"
                label="Issues" />

              <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SESSIONS)">
                <q-separator />

                <ContextMenuItem
                  v-close-popup
                  @was-clicked="useUiStore().sidePanelSetActiveView(SidePanelViews.SESSIONS)"
                  color="warning"
                  icon="sym_o_new_window"
                  label="Sessions..." />
              </template>

              <q-separator />

              <ContextMenuItem
                v-close-popup
                @was-clicked="reload()"
                color="negative"
                icon="o_replay"
                label="Restart Tabsets" />
            </q-list>
          </q-menu>
        </span>
      </div>
    </div>
  </q-footer>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { openURL, uid, useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import SidePanelFooterLeftButtons from 'src/components/helper/SidePanelFooterLeftButtons.vue'
import SidePanelStatsMarkupTable from 'src/components/helper/SidePanelStatsMarkupTable.vue'
import { useContentStore } from 'src/content/stores/contentStore'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ToastType } from 'src/core/models/Toast'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useAuthStore } from 'src/stores/authStore'
import SuggestionDialog from 'src/suggestions/dialogues/SuggestionDialog.vue'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import SidePanelMessagesMarkup from 'src/tabsets/components/helper/SidePanelMessagesMarkup.vue'
import SidePanelTabsetListMarkup from 'src/tabsets/components/helper/SidePanelTabsetListMarkup.vue'
import { Tab, TabSnippet } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import WindowsMarkupTable from 'src/windows/components/WindowsMarkupTable.vue'
import { Window } from 'src/windows/models/Window'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabsetsUiStore } from '../tabsets/stores/tabsetsUiStore'

const { inBexMode } = useUtils()

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<TabAndTabsetId[]>([])
const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const showSuggestionButton = ref(false)
const showSuggestionIcon = ref(false)
const doShowSuggestionButton = ref(false)
const transitionGraceTime = ref(false)
const showWindowTable = ref(false)
const showStatsTable = ref(false)
const ignored = ref('')
const showLogin = ref(false)
const randomKey = ref<string>(uid())
const progressValue = ref<number>(0.0)
const progressLabel = ref<string>('')
const animateSettingsButton = ref<boolean>(false)

watch(
  () => useSpacesStore().space,
  (now: any, before: any) => {
    console.log(`space switched from ${before?.id} to ${now?.id}`)
    useTabsetsUiStore().load()
  },
)

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id
  if (windowId) {
    if (useWindowsStore().windowForId(windowId, 'SidePanelFooter1')?.open) {
      showWindowTable.value = useWindowsStore().windowForId(windowId, 'SidePanelFooter2')?.open || false
    }
  }
})

watchEffect(() => {
  showLogin.value = useUiStore().showLoginTable
})

watchEffect(() => {
  animateSettingsButton.value = useUiStore().animateSettingsButton
})

watchEffect(async () => {
  const suggestions = useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED', 'NOTIFICATION'])
  if (!chrome || !chrome.windows) {
    return
  }
  const currentWindow = await chrome.windows.getCurrent()
  //console.log("watcheffect for", suggestions)
  showSuggestionButton.value =
    doShowSuggestionButton.value ||
    (useUiStore().sidePanelActiveViewIs(SidePanelViews.MAIN) &&
      _.findIndex(suggestions, (s: Suggestion) => {
        return (
          s.state === 'NEW' ||
          (s.type === 'SWITCH_TABSET' && s.windowId === currentWindow.id) ||
          (s.state === 'NOTIFICATION' && !useFeaturesStore().hasFeature(FeatureIdent.NOTIFICATIONS))
        )
      }) >= 0)

  showSuggestionIcon.value =
    !doShowSuggestionButton.value &&
    useUiStore().sidePanelActiveViewIs(SidePanelViews.MAIN) &&
    _.findIndex(suggestions, (s: Suggestion) => {
      return s.state === 'DECISION_DELAYED'
    }) >= 0
})

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    currentTabs.value = useTabsetsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  if (!inBexMode()) {
    return
  }
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) //|| useTabsStore2().currentChromeTab
})

watchEffect(() => {
  const uiProgress = useUiStore().progress
  if (uiProgress) {
    progressValue.value = (uiProgress['val' as keyof object] as number) || 0.0
    progressLabel.value = uiProgress['label' as keyof object] || ''
    //console.log("we are here", progressValue.value)
  }
})

const openOptionsPage = () => {
  if ($q.platform.is.cordova || $q.platform.is.capacitor || !$q.platform.is.bex) {
    router.push('/settings')
  } else {
    NavigationService.openOrCreateTab(
      [chrome.runtime.getURL('www/index.html#/mainpanel/settings')],
      undefined,
      [],
      true,
      true,
    )
  }
}

const openExtensionTab = () => openURL(chrome.runtime.getURL('www/index.html#/fullpage'))

const settingsTooltip = () => {
  return 'Open Settings of Tabsets ' + import.meta.env.PACKAGE_VERSION
}

const rightButtonClass = () => 'q-my-xs q-px-xs q-mr-none'

const dependingOnStates = () =>
  _.find(useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED']), (s: Suggestion) => s.state === 'NEW')
    ? 'warning'
    : 'primary'

const suggestionDialog = () => {
  doShowSuggestionButton.value = false
  $q.dialog({
    component: SuggestionDialog,
    componentProps: {
      suggestion: useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED', 'NOTIFICATION']).at(0),
      fromPanel: true,
    },
  })
}
const suggestionsLabel = () => {
  const suggestions = useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED', 'NOTIFICATION'])
  return suggestions.length === 1 ? suggestions.length + ' New Suggestion' : suggestions.length + ' New Suggestions'
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
      if (useUiStore().toasts.length === 0) {
        // only if all toasts are gone
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
  const defaults = ' text-white q-py-none'
  switch (useUiStore().toasts[0]?.type) {
    case ToastType.INFO:
      return 'bg-positive' + defaults
    case ToastType.WARNING:
      return 'bg-warning' + defaults
    case ToastType.ERROR:
      return 'bg-negative' + defaults
    default:
      return 'bg-negative' + defaults
  }
}

const toggleShowWindowTable = async () => {
  showWindowTable.value = !showWindowTable.value
  if (showWindowTable.value) {
    randomKey.value = uid()
    showStatsTable.value = false
    await useWindowsStore().setup('showWindowTable-called')
  }
  const windowId = useWindowsStore().currentBrowserWindow?.id
  if (windowId) {
    console.log('got windowId', windowId)
    const currentWindow: Window | undefined = useWindowsStore().windowForId(windowId, 'SidePanelFooter3')
    if (currentWindow) {
      currentWindow.open = showWindowTable.value
      await useWindowsStore().upsertTabsetWindow(currentWindow)
    }
  }
}

const toggleShowStatsTable = () => {
  showStatsTable.value = !showStatsTable.value
  if (showWindowTable.value) {
    showWindowTable.value = false
  }
}

const offsetBottom = () => ($q.platform.is.capacitor || $q.platform.is.cordova ? 'margin-bottom:20px;' : '')
const showSettingsButton = () => route?.path !== '/sidepanel/welcome' || useAuthStore().isAuthenticated

const drop = (evt: any) => {
  evt.preventDefault()
  var text = evt.dataTransfer.getData('text')
  var html = evt.dataTransfer.getData('text/html')
  const currentTabUrl = useContentStore().getCurrentTabUrl
  console.log('===>', evt, text, html, currentTabUrl)
  if (currentTabUrl) {
    const existing: Tab | undefined = useTabsetsStore().tabForUrlInSelectedTabset(currentTabUrl!)
    if (existing) {
      existing.snippets.push(new TabSnippet(text, html))
      existing.title = 'Snippet (' + existing.snippets.length + ')'
      const currentTabset = useTabsetsStore().getCurrentTabset
      if (currentTabset) {
        useTabsetsStore().saveTabset(currentTabset)
      }
    } else {
      const tab = new Tab(uid(), BrowserApi.createChromeTabObject('Snippet', currentTabUrl!))
      tab.snippets.push(new TabSnippet(text, html))
      tab.description = text
      useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(tab))
    }
  }
}

const reload = () => window.location.reload()
</script>

<style>
.fade-enter-active {
  transition: opacity 0.5s ease;
}

.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
