<template>

  <q-footer
    class="q-pa-none q-mt-sm darkInDarkMode brightInBrightMode" style="border-top: 1px solid lightgrey;"
    :style="offsetBottom()">

    <template v-if="checkToasts()" class="q-ma-xs q-pa-xs">
      <Transition name="fade" appear>
        <q-banner
          inline-actions dense rounded
          style="font-size: smaller;text-align: center"
          :class="toastBannerClass()">
          {{ useUiStore().toasts[0]?.msg }}
          <template v-slot:action v-if="useUiStore().toasts[0]?.actions[0]">
            <q-btn flat :label="useUiStore().toasts[0].actions[0].label"
                   @click="useUiStore().callUndoActionFromCurrentToast()"/>
          </template>
        </q-banner>
      </Transition>
    </template>

    <template v-if="useFeaturesStore().hasFeature(FeatureIdent.TABSET_LIST)">
      <SidePanelTabsetListMarkup/>
    </template>

    <div class="row fit q-mb-sm" v-if="showWindowTable">
      <!-- https://michaelnthiessen.com/force-re-render -->

      <WindowsMarkupTable
        :rows="useWindowsStore().getWindowsForMarkupTable(getAdditionalActions)"
        @was-clicked="e => additionalActionWasClicked(e)"
        @recalculate-windows="windowHolderRows = calcWindowHolderRows()"
        :key="randomKey"
      />

    </div>

    <div class="row fit q-mb-sm" v-if="showStatsTable">
      <SidePanelStatsMarkupTable :key="randomKey"/>
    </div>

    <div class="row fit q-ma-none q-pa-none" v-if="!checkToasts() && useUiStore().progress">
      <div class="col-12">
        <q-linear-progress stripe size="18px" :value="progressValue" color="grey-7" track-color="grey-4">
          <div class="absolute-full flex flex-center">
            <q-badge :label="progressLabel" color="grey"/>
          </div>
        </q-linear-progress>

      </div>
    </div>

    <div class="row fit q-ma-none q-pa-none">
      <div class="col-6">

        <!--        <Transition name="fade" appear>-->
        <!--          <q-banner-->
        <!--            v-if="checkToasts()"-->
        <!--            inline-actions dense rounded-->
        <!--            style="font-size: smaller;text-align: center"-->
        <!--            :class="toastBannerClass()">-->
        <!--            {{ useUiStore().toasts[0]?.msg }}-->
        <!--            <template v-slot:action v-if="useUiStore().toasts[0]?.actions[0]">-->
        <!--              <q-btn flat :label="useUiStore().toasts[0].actions[0].label"-->
        <!--                     @click="useUiStore().callUndoActionFromCurrentToast()"/>-->
        <!--            </template>-->
        <!--          </q-banner>-->
        <!--        </Transition>-->

        <q-btn v-if="!transitionGraceTime && showSuggestionButton"
               outline
               icon="o_lightbulb"
               :label="suggestionsLabel()"
               :color="dependingOnStates()"
               size="12px"
               @click="suggestionDialog()"
               class="q-ma-none q-pa-xs q-ml-sm q-mt-xs q-pr-md cursor-pointer">
        </q-btn>

        <template v-if="!transitionGraceTime && !showSuggestionButton">
          <SidePanelFooterLeftButtons
            @was-clicked="doShowSuggestionButton = true"
            :size="getButtonSize()"
            :show-suggestion-icon="showSuggestionIcon"/>
        </template>

      </div>
      <div class="col text-right" v-if="useUiStore().appLoading">
        &nbsp;
      </div>
      <div v-else class="col text-right">
        <span>
        <input
          class="q-ma-none q-pa-none"
          v-if="useFeaturesStore().hasFeature(FeatureIdent.HTML_SNIPPETS) && useContentStore().getCurrentTabUrl"
          v-model="ignored"
          style="border:1px dotted grey;border-radius:3px;max-width:30px;max-height:20px"
          @drop="drop($event)"/>
          <q-tooltip class="tooltip_small">Drag and drop text or images from your current tab</q-tooltip>
        </span>
        <span>
          <q-btn icon="o_settings" v-if="showSettingsButton()"
                 class="q-my-xs q-px-xs q-mr-none"
                 :class="{ shake: animateSettingsButton }"
                 flat
                 :size="getButtonSize()">
            <q-tooltip :delay="4000" class="tooltip_small" anchor="top left" self="bottom left">{{
                settingsTooltip()
              }}</q-tooltip>
          </q-btn>
          <q-menu :offset="[-10, 0]">
            <q-list dense>
              <ContextMenuItem
                v-close-popup
                @was-clicked="openOptionsPage()"
                icon="o_settings"
                label="Open Settings"/>

              <q-separator/>

              <ContextMenuItem
                v-close-popup
                @was-clicked="openURL('https://docs.tabsets.net')"
                icon="o_open_in_new"
                label="Documentation"/>

              <ContextMenuItem
                v-close-popup
                @was-clicked="openURL('https://docs.google.com/forms/d/e/1FAIpQLSdUtiKIyhqmNoNkXXzZOEhnzTCXRKT-Ju83SyyEovnfx1Mapw/viewform?usp=pp_url')"
                icon="o_open_in_new"
                label="Feedback"/>

              <ContextMenuItem
                v-close-popup
                @was-clicked="openURL('https://github.com/evandor/tabsets/issues')"
                icon="o_open_in_new"
                label="Issues"/>

              <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SESSIONS)">

                <q-separator/>

                <ContextMenuItem
                  :disable="useTabsetsStore().getCurrentTabset?.type!==TabsetType.DEFAULT"
                  v-close-popup
                  @was-clicked="startSession()"
                  color="warning"
                  icon="sym_o_new_window"
                  label="Start new Session..."/>

              </template>

              <q-separator/>

              <ContextMenuItem
                v-close-popup
                @was-clicked="reload()"
                color="negative"
                icon="o_replay"
                label="Restart Tabsets"/>


            </q-list>
          </q-menu>
        </span>

        <q-btn v-if="useFeaturesStore().hasFeature(FeatureIdent.WINDOWS_MANAGEMENT)"
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

        <span v-if="useFeaturesStore().hasFeature(FeatureIdent.STANDALONE_APP)">
          <q-icon
            name="o_open_in_new"
            @click="openExtensionTab()"
            :class="rightButtonClass()"
            class="cursor-pointer"
            flat
            size="20px">
            <q-tooltip :delay="2000" anchor="center left" self="center right"
                       class="tooltip-small">Tabsets as full-page app</q-tooltip>
          </q-icon>
          <!--          <q-menu :offset="[0, 7]" fit>-->
          <!--            <q-list dense style="min-width: 200px;min-height:50px">-->
          <!--              <q-item clickable v-close-popup>-->
          <!--                <q-item-section @click="openExtensionTab()">Tabsets as full-page app</q-item-section>-->
          <!--              </q-item>-->
          <!--              <q-item clickable v-close-popup>-->
          <!--                <q-item-section @click="openPwaUrl()">Tabsets Online Access</q-item-section>-->
          <!--              </q-item>-->
          <!--            </q-list>-->
          <!--          </q-menu>-->
        </span>
        <q-btn v-else-if="useFeaturesStore().hasFeature(FeatureIdent.STANDALONE_APP)"
               icon="o_open_in_new"
               :class="rightButtonClass()"
               flat
               :size="getButtonSize()"
               @click="openExtensionTab()">
          <q-tooltip class="tooltip_small" anchor="top left" self="bottom left">Tabsets as full-page app</q-tooltip>
        </q-btn>


      </div>
    </div>

  </q-footer>
</template>
<script setup lang="ts">
import {useUiStore} from "src/ui/stores/uiStore";
import {onMounted, ref, watch, watchEffect} from "vue";
import {useRoute, useRouter} from "vue-router";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import NavigationService from "src/services/NavigationService";
import {openURL, uid, useQuasar} from "quasar";
import {useUtils} from "src/core/services/Utils"
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import _ from "lodash";
import {Suggestion, SuggestionState} from "src/suggestions/models/Suggestion";
import SuggestionDialog from "src/suggestions/dialogues/SuggestionDialog.vue";
import {Tabset, TabsetType} from "src/tabsets/models/Tabset";
import {ToastType} from "src/core/models/Toast";
import SidePanelFooterLeftButtons from "components/helper/SidePanelFooterLeftButtons.vue";
import {useAuthStore} from "stores/authStore";
import {useNotificationHandler} from "src/core/services/ErrorHandler";
import SidePanelStatsMarkupTable from "components/helper/SidePanelStatsMarkupTable.vue"
import {Window} from "src/windows/models/Window"
import WindowsMarkupTable from "src/windows/components/WindowsMarkupTable.vue";
import {WindowAction, WindowHolder} from "src/windows/models/WindowHolder";
import NewTabsetDialog from "src/tabsets/dialogues/NewTabsetDialog.vue";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {SidePanelViews} from "src/app/models/SidePanelViews";
import {TabAndTabsetId} from "src/tabsets/models/TabAndTabsetId";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import {Tab, TabSnippet} from "src/tabsets/models/Tab";
import BrowserApi from "src/app/BrowserApi";
import {useContentStore} from "src/content/stores/contentStore";
import ContextMenuItem from "src/core/components/helper/ContextMenuItem.vue";
import {useTabsetsUiStore} from "../tabsets/stores/tabsetsUiStore";
import SidePanelTabsetListMarkup from "components/helper/SidePanelTabsetListMarkup.vue";
import StartSessionDialog from "src/tabsets/dialogues/StartSessionDialog.vue";
import {CreateTabsetCommand} from "src/tabsets/commands/CreateTabsetCommand";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {SaveOrReplaceResult} from "src/tabsets/models/SaveOrReplaceResult";

const {handleError} = useNotificationHandler()

const {inBexMode} = useUtils()

const $q = useQuasar()
const route = useRoute()

const router = useRouter()

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
const windowHolderRows = ref<WindowHolder[]>([])
const windowsToOpenOptions = ref<object[]>([])
const tabsetsMangedWindows = ref<object[]>([])

onMounted(() => {
  windowHolderRows.value = calcWindowHolderRows()
})

watch(() => useSpacesStore().space, (now: any, before: any) => {
  console.log(`space switched from ${before?.id} to ${now?.id}`)
  useTabsetsUiStore().load()
})

watchEffect(() => {
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  if (useWindowsStore().windowForId(windowId)?.open) {
    //console.log("setting showWindowTable to ", useWindowsStore().windowForId(windowId)?.open)
    showWindowTable.value = useWindowsStore().windowForId(windowId)?.open || false
  }
})

watchEffect(() => {
  showLogin.value = useUiStore().showLoginTable
})

watchEffect(() => {
  animateSettingsButton.value = useUiStore().animateSettingsButton
})

watchEffect(() => {
  const suggestions = useSuggestionsStore().getSuggestions(
    [SuggestionState.NEW, SuggestionState.DECISION_DELAYED, SuggestionState.NOTIFICATION])
  //console.log("watcheffect for", suggestions)
  showSuggestionButton.value =
    doShowSuggestionButton.value ||
    (useUiStore().sidePanelActiveViewIs(SidePanelViews.MAIN) &&
      _.findIndex(suggestions, (s: Suggestion) => {
        return s.state === SuggestionState.NEW ||
          (s.state === SuggestionState.NOTIFICATION && !useFeaturesStore().hasFeature(FeatureIdent.NOTIFICATIONS))
      }) >= 0)

  showSuggestionIcon.value =
    !doShowSuggestionButton.value &&
    useUiStore().sidePanelActiveViewIs(SidePanelViews.MAIN) &&
    _.findIndex(suggestions, (s: Suggestion) => {
      return s.state === SuggestionState.DECISION_DELAYED
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
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) //|| useTabsStore2().currentChromeTab
})

watchEffect(() => {
  const uiProgress = useUiStore().progress
  if (uiProgress) {
    progressValue.value = uiProgress['val' as keyof object] as number || 0.0
    progressLabel.value = uiProgress['label' as keyof object] || ''
    //console.log("we are here", progressValue.value)
  }
})

const getAdditionalActions = (windowName: string) => {
  const additionalActions: WindowAction[] = []
  if (!windowIsManaged(windowName)) {
    additionalActions.push(new WindowAction("o_bookmark_add", "saveTabset", "text-orange", "Save as Tabset"))
  } else {
    additionalActions.push(new WindowAction("o_bookmark_add", undefined, "text-grey", "already a tabset", true))
  }
  return additionalActions
}


const updateWindows = () => {
  useWindowsStore().setup('window-updated', true)
    .then(() => windowHolderRows.value = calcWindowHolderRows())
}


watch(() => useWindowsStore().currentChromeWindows, (newWindows, oldWindows) => {
  windowHolderRows.value = calcWindowHolderRows()
})

if (inBexMode()) {
  chrome.windows.onCreated.addListener((w: chrome.windows.Window) => updateWindows())
  chrome.windows.onRemoved.addListener((wId: number) => updateWindows())


  chrome.tabs.onRemoved.addListener((tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
    useWindowsStore().setup('on removed in SidePanelFooter')
      .then(() => windowHolderRows.value = calcWindowHolderRows())
      .catch((err) => handleError(err))
  })


  chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    if (changeInfo.status === "complete") {
      useWindowsStore().setup('on updated in SidePanelFooter')
        .then(() => windowHolderRows.value = calcWindowHolderRows())
        .catch((err) => {
          console.log("could not yet calcWindowRows: " + err)
        })
    }
  })
}

watchEffect(() => {
  // adding potentially new windows from 'open in window' logic
  windowsToOpenOptions.value = []
  tabsetsMangedWindows.value = []
  for (const ts of [...useTabsetsStore().tabsets.values()] as Tabset[]) {
    if (ts.window && ts.window !== "current" && ts.window.trim() !== '') {
      tabsetsMangedWindows.value.push({label: ts.window, value: ts.id})
      const found = _.find(windowHolderRows.value, (r: object) => ts.window === r['name' as keyof object])
      if (!found) {
        windowsToOpenOptions.value.push({label: ts.window, value: ts.id})
      }
    }
  }
  windowsToOpenOptions.value = _.sortBy(windowsToOpenOptions.value, ["label"])
})

const openOptionsPage = () => {
  ($q.platform.is.cordova || $q.platform.is.capacitor || !$q.platform.is.bex) ?
    router.push("/settings") :
    NavigationService.openOrCreateTab([chrome.runtime.getURL('www/index.html#/mainpanel/settings')], undefined, [], true, true)
}

const openExtensionTab = () =>
  openURL(chrome.runtime.getURL('www/index.html#/fullpage'))

const settingsTooltip = () => {
  return "Open Settings of Tabsets " + import.meta.env.PACKAGE_VERSION
}

const rightButtonClass = () => "q-my-xs q-px-xs q-mr-none"

const dependingOnStates = () =>
  _.find(useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED]), (s: Suggestion) => s.state === SuggestionState.NEW) ? 'warning' : 'primary'

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

const toggleShowWindowTable = () => {
  showWindowTable.value = !showWindowTable.value
  if (showWindowTable.value) {
    randomKey.value = uid()
    showStatsTable.value = false
  }
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  const currentWindow: Window | undefined = useWindowsStore().windowForId(windowId)
  if (currentWindow) {
    currentWindow.open = showWindowTable.value
    useWindowsStore().upsertTabsetWindow(currentWindow)
  }
}

const toggleShowStatsTable = () => {
  showStatsTable.value = !showStatsTable.value
  if (showWindowTable.value) {
    showWindowTable.value = false
  }
}

const calcWindowHolderRows = (): WindowHolder[] => {
  const result = _.map(useWindowsStore().currentChromeWindows as chrome.windows.Window[], (cw: chrome.windows.Window) => {
    const windowFromStore: Window | undefined = useWindowsStore().windowForId(cw.id || -2)
    const windowName = useWindowsStore().windowNameFor(cw.id || 0) || cw.id!.toString()
    const additionalActions: WindowAction[] = []
    if (!windowIsManaged(windowName)) {
      additionalActions.push(new WindowAction("o_bookmark_add", "saveTabset", "text-orange", "Save as Tabset"))
    } else {
      additionalActions.push(new WindowAction("o_bookmark_add", undefined, "text-grey", "already a tabset", true))
    }

    if (windowFromStore) {
      windowFromStore.title = windowName
      return WindowHolder.of(windowFromStore, cw, cw.id || -6, additionalActions)
    } else {
      return WindowHolder.of(null as unknown as Window, cw, cw.id || -7, additionalActions)
    }
  })

  return _.sortBy(result, "index")
}

const windowIsManaged = (windowName: string) => {
  //console.log("managed?", tabsetsMangedWindows.value, windowName)
  return _.find(tabsetsMangedWindows.value, (tmw: any) => tmw['label' as keyof object] === windowName) !== undefined
}

const saveAsTabset = (windowId: number, name: string) => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      windowId: windowId,
      spaceId: useSpacesStore().space?.id,
      name: name,
      fromPanel: true
    }
  })
}
const additionalActionWasClicked = (event: any) => {
  if (event.action === 'saveTabset') {
    saveAsTabset(event.window.id, event.window.name)
  }
}

const offsetBottom = () => ($q.platform.is.capacitor || $q.platform.is.cordova) ? 'margin-bottom:20px;' : ''
const showSettingsButton = () => route?.path !== '/sidepanel/welcome' || useAuthStore().isAuthenticated

const drop = (evt: any) => {
  evt.preventDefault()
  var text = evt.dataTransfer.getData('text')
  var html = evt.dataTransfer.getData('text/html')
  const currentTabUrl = useContentStore().getCurrentTabUrl
  console.log("===>", evt, text, html, currentTabUrl)
  if (currentTabUrl) {
    const existing: Tab | undefined = useTabsetsStore().tabForUrlInSelectedTabset(currentTabUrl!)
    if (existing) {
      existing.snippets.push(new TabSnippet(text, html))
      existing.title = "Snippet (" + existing.snippets.length + ")"
      const currentTabset = useTabsetsStore().getCurrentTabset
      if (currentTabset) {
        useTabsetsStore().saveTabset(currentTabset)
      }
    } else {
      const tab = new Tab(uid(), BrowserApi.createChromeTabObject("Snippet", currentTabUrl!))
      tab.snippets.push(new TabSnippet(text, html))
      tab.description = text
      useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(tab))
    }
  }
}

const reload = () => window.location.reload()

const startSession = () => {
  $q.dialog({
    component: StartSessionDialog
  }).onOk((callback: object) => {
    console.log("callback", callback)
    const tabsToUse = useTabsStore2().browserTabs
    useCommandExecutor()
      .execute(new CreateTabsetCommand(callback['oldSessionName' as keyof object], tabsToUse))
      .then((res: ExecutionResult<SaveOrReplaceResult>) => {
        console.log("res", res.result.tabset)
        const ts = res.result.tabset
        ts.type = TabsetType.SESSION
        useTabsetsStore().saveTabset(ts)
        BrowserApi.closeAllTabs(false)
      })
      .then(() => {
        useCommandExecutor()
          .executeFromUi(new CreateTabsetCommand(callback['sessionName' as keyof object], []))
      })
  })

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
