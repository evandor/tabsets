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

    <SidePanelSharedInfoMarkup />

    <template v-if="useFeaturesStore().hasFeature(FeatureIdent.TABSET_LIST) && useUiStore().showTabsetList">
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
        <q-linear-progress stripe size="18px" :value="progressValue" color="warning" track-color="grey-4">
          <div class="absolute-full flex flex-center">
            <q-badge :label="progressLabel" color="white" text-color="primary" />
          </div>
        </q-linear-progress>
        <!--        <q-btn v-if="useUiStore().progress && useUiStore().progress!['cancelable' as keyof object]" name="cancel" />-->
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
        <q-icon
          class="cursor-pointer q-mr-sm"
          v-if="!useUiStore().showTabsetList"
          name="o_featured_play_list"
          @click="useUiStore().hideTabsetList(false)" />
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
            :class="{ shakeWithColor: animateSettingsButton }"
            flat
            :size="getButtonSize()">
            <q-tooltip :delay="4000" class="tooltip_small" anchor="top left" self="bottom left">{{
              settingsTooltip()
            }}</q-tooltip>
          </q-btn>
          <q-menu :offset="[-10, 0]">
            <q-list dense style="min-width: 190px">
              <ContextMenuItem v-close-popup @was-clicked="openOptionsPage()" icon="o_settings" label="Open Settings" />

              <q-separator />

              <template v-if="syncingActive()">
                <ContextMenuItem
                  v-close-popup
                  @was-clicked="syncNow()"
                  icon="o_sync"
                  :label="'Sync (' + lastSyncTime() + ')'" />

                <q-separator />
              </template>

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

              <template v-if="useFeaturesStore().hasFeature(FeatureIdent.STASHING)">
                <q-separator />

                <ContextMenuItem
                  v-close-popup
                  @was-clicked="stashDialog()"
                  color="warning"
                  icon="sym_o_new_window"
                  label="Stash..." />
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
        <span class="q-my-xs q-ml-xs q-mr-none cursor-pointer" v-if="authStore.isAuthenticated()">
          <q-avatar size="24px" v-if="authStore.user?.photoURL">
            <q-img :src="authStore.user.photoURL" />
            <q-tooltip :delay="2000" anchor="center left" self="center right" class="tooltip-small"
              >You're logged in as {{ authStore.user?.email }}</q-tooltip
            >
          </q-avatar>
          <q-avatar size="24px" v-else-if="authStore.avatar">
            <q-img :src="authStore.avatar" />
            <q-tooltip :delay="2000" anchor="center left" self="center right" class="tooltip-small"
              >You're logged in as {{ authStore.user?.email }}</q-tooltip
            >
          </q-avatar>
          <q-icon v-else name="o_person" size="20px">
            <q-tooltip :delay="2000" anchor="center left" self="center right" class="tooltip-small"
              >You're logged in as {{ authStore.user?.email }}</q-tooltip
            >
          </q-icon>

          <q-menu :offset="[0, 7]" fit>
            <q-list dense style="min-width: 150px; min-height: 50px">
              <q-item clickable v-close-popup v-if="useAuthStore().getAccount()?.products">
                <q-item-section @click="gotoStripe()">Subscriptions</q-item-section>
              </q-item>
              <q-item clickable v-close-popup v-else>
                <q-item-section class="text-grey">Subscriptions</q-item-section>
              </q-item>
              <!--              <q-item clickable v-close-popup>-->
              <!--                <q-item-section @click="subscribe()">Subscribe</q-item-section>-->
              <!--              </q-item>-->
              <q-item clickable v-close-popup>
                <q-item-section class="ellipsis" @click="logout()">Logout {{ authStore.user?.email }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </span>
        <q-btn
          v-else-if="showLoginBtn()"
          icon="login"
          :class="rightButtonClass()"
          flat
          color="blue"
          :size="getButtonSize()"
          @click="gotoLoginPage()">
          <q-tooltip class="tooltip_small">Log in or Sign up</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-footer>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { date, LocalStorage, openURL, uid, useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { GITHUB_AUTO_SYNC, GITHUB_AUTO_SYNC_LASTUPDATE } from 'src/boot/constants'
import { useContentStore } from 'src/content/stores/contentStore'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import SidePanelFooterLeftButtons from 'src/core/components/helper/SidePanelFooterLeftButtons.vue'
import SidePanelStatsMarkupTable from 'src/core/components/helper/SidePanelStatsMarkupTable.vue'
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
import { CreateStashCommand } from 'src/tabsets/commands/CreateStashCommand'
import { GithubReadEventsCommand } from 'src/tabsets/commands/github/GithubReadEventsCommand'
import SidePanelMessagesMarkup from 'src/tabsets/components/helper/SidePanelMessagesMarkup.vue'
import SidePanelSharedInfoMarkup from 'src/tabsets/components/helper/SidePanelSharedInfoMarkup.vue'
import SidePanelTabsetListMarkup from 'src/tabsets/components/helper/SidePanelTabsetListMarkup.vue'
import StartSessionDialog from 'src/tabsets/dialogues/StartSessionDialog.vue'
import { Tab, TabSnippet } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import WindowsMarkupTable from 'src/windows/components/WindowsMarkupTable.vue'
import { Window } from 'src/windows/models/Window'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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
  animateSettingsButton.value = useUiStore().animateSettingsButton
})

const calcShowSuggestionButton = async (suggestions: Suggestion[]) => {
  const currentWindow = await chrome.windows.getCurrent()
  if (!chrome || !chrome.windows) {
    return false
  }
  return (
    doShowSuggestionButton.value ||
    (useUiStore().sidePanelActiveViewIs(SidePanelViews.MAIN) &&
      _.findIndex(suggestions, (s: Suggestion) => {
        return (
          s.state === 'NEW' ||
          (s.type === 'SWITCH_TABSET' && s.windowId === currentWindow.id) ||
          (s.state === 'NOTIFICATION' && !useFeaturesStore().hasFeature(FeatureIdent.NOTIFICATIONS))
        )
      }) >= 0)
  )
}

const calcShowSuggestionIcon = (suggestions: Suggestion[]) => {
  return (
    !doShowSuggestionButton.value &&
    useUiStore().sidePanelActiveViewIs(SidePanelViews.MAIN) &&
    _.findIndex(suggestions, (s: Suggestion) => {
      return s.state === 'DECISION_DELAYED'
    }) >= 0
  )
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  const suggestions: Suggestion[] = useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED', 'NOTIFICATION'])
  showSuggestionButton.value = await calcShowSuggestionButton(suggestions)
  showSuggestionIcon.value = calcShowSuggestionIcon(suggestions)
})

watch(
  () => doShowSuggestionButton.value,
  async () => {
    const suggestions: Suggestion[] = useSuggestionsStore().getSuggestions(['NEW', 'DECISION_DELAYED', 'NOTIFICATION'])
    showSuggestionButton.value = await calcShowSuggestionButton(suggestions)
    showSuggestionIcon.value = calcShowSuggestionIcon(suggestions)
  },
)

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
    router.push('mainpanel/settings')
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

const gotoLoginPage = () => router.push('/sidepanel/login')

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

const logout = () => {
  authStore
    .logout()
    .then(() => {
      // router.push("/refresh/sidepanel")
    })
    .catch(() => {
      //this.handleError(error)
    })
}

const offsetBottom = () => ($q.platform.is.capacitor || $q.platform.is.cordova ? 'margin-bottom:20px;' : '')
const gotoStripe = () => openURL(process.env.STRIPE_CUSTOMER_PORTAL!)
// const openPwaUrl = () => NavigationService.openOrCreateTab([process.env.TABSETS_PWA_URL || 'https://www.skysail.io'])
const showLoginBtn = () => process.env.TABSETS_USE_AUTH
const showSettingsButton = () => route?.path !== '/sidepanel/welcome' || useAuthStore().isAuthenticated()

const drop = (evt: any) => {
  evt.preventDefault()
  var text = evt.dataTransfer.getData('text')
  var html = evt.dataTransfer.getData('text/html')
  const currentTabUrl = useContentStore().getCurrentTabUrl
  console.log('===>', evt, text, html, currentTabUrl)
  if (currentTabUrl) {
    const existing: Tab | undefined = useTabsetsStore().tabForUrlInSelectedTabset(currentTabUrl)
    if (existing) {
      existing.snippets.push(new TabSnippet(text, html))
      existing.title = 'Snippet (' + existing.snippets.length + ')'
      const currentTabset = useTabsetsStore().getCurrentTabset
      if (currentTabset) {
        useTabsetsStore().saveTabset(currentTabset)
      }
    } else {
      const tab = new Tab(uid(), BrowserApi.createChromeTabObject('Snippet', currentTabUrl))
      tab.snippets.push(new TabSnippet(text, html))
      tab.description = text
      useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(tab))
    }
  }
}

const reload = () => window.location.reload()

const warningOrErrorCount = (): string | undefined => {
  const warningCount = useUiStore().warningCount
  const errorCount = useUiStore().errorCount
  if (errorCount > 0) {
    return errorCount > 9 ? '9+' : errorCount.toString()
  }
  if (warningCount > 0) {
    return warningCount > 9 ? '9+' : warningCount.toString()
  }
  return undefined
}
const warningOrErrorColor = () => {
  const warningCount = useUiStore().warningCount
  const errorCount = useUiStore().errorCount
  if (errorCount > 0) {
    return 'negative'
  }
  if (warningCount > 0) {
    return 'warning'
  }
  return 'primary'
}

const syncingActive = () => LocalStorage.getItem(GITHUB_AUTO_SYNC)

const syncNow = () => {
  const lastUpdate: number = (LocalStorage.getItem(GITHUB_AUTO_SYNC_LASTUPDATE) as number) || 0
  useCommandExecutor().executeFromUi(new GithubReadEventsCommand(lastUpdate))
  router.push('/sidepanel/collections')
}

const lastSyncTime = () => {
  const lastUpdate: number = (LocalStorage.getItem(GITHUB_AUTO_SYNC_LASTUPDATE) as number) || 0
  if (lastUpdate == 0) {
    return 'never'
  }
  return date.formatDate(lastUpdate, 'DD.MM.YY HH:mm')
}

const stashDialog = () => {
  $q.dialog({
    component: StartSessionDialog,
  }).onOk((callback: { oldSessionName: string; collection: string }) => {
    useCommandExecutor().executeFromUi(new CreateStashCommand(callback.oldSessionName, callback.collection))
    router.push('/sidepanel/sessions')
  })
}
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
