<template>

  <q-footer
    class="q-pa-xs q-mt-sm darkInDarkMode brightInBrightMode" style="border-top: 1px solid lightgrey" :style="offsetBottom()">
    <div class="row fit q-mb-sm" v-if="showLogin">
      <SidePanelLoginWidget @hide-login="showLogin = false"/>
    </div>

    <div class="row fit q-mb-sm" v-if="showWindowTable">
      <!-- https://michaelnthiessen.com/force-re-render -->
      <SidePanelWindowMarkupTable :key="randomKey"/>
    </div>

    <div class="row fit">
      <div class="col-7">

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

      </div>
      <div class="col text-right" v-if="useUiStore().appLoading">
        &nbsp;
      </div>
      <div v-else class="col text-right">
        <q-btn icon="o_help" v-if="usePermissionsStore().hasFeature(FeatureIdent.HELP)"
               :class="rightButtonClass()"
               flat
               :size="getButtonSize()"
               @click="openHelpView()">
        </q-btn>

        <q-btn icon="o_settings" v-if="useTabsStore().tabsets.size > 0 || useAuthStore().isAuthenticated()"
               :class="rightButtonClass()"
               flat
               :size="getButtonSize()"
               @click="openOptionsPage()">
          <q-tooltip class="tooltip" anchor="top left" self="bottom left">{{ settingsTooltip() }}</q-tooltip>
        </q-btn>

        <q-btn
          icon="o_grid_view"
          data-testid="buttonManageWindows"
          :class="rightButtonClass()"
          flat
          :size="getButtonSize()"
          @click="toggleShowWindowTable()">
          <q-tooltip class="tooltip" anchor="top left" self="bottom left">Manage Windows</q-tooltip>
        </q-btn>

        <span v-if="usePermissionsStore().hasFeature(FeatureIdent.STANDALONE_APP)">
          <q-icon
            name="o_open_in_new"
            :class="rightButtonClass()"
            class="cursor-pointer"
            flat
            size="20px">
            <q-tooltip :delay="2000" anchor="center left" self="center right"
                       class="tooltip-small">Alternative Access</q-tooltip>
          </q-icon>
          <q-menu :offset="[0, 7]" fit>
            <q-list dense style="min-width: 200px;min-height:50px">
              <q-item clickable v-close-popup>
                <q-item-section @click="openExtensionTab()">Tabsets as full-page app</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section @click="NavigationService.openOrCreateTab(['https://shared.tabsets.net'])">Tabsets Online Access</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </span>

        <span class="q-my-xs q-ml-xs q-mr-none cursor-pointer" v-if="authStore.isAuthenticated()">
          <q-avatar size="18px" v-if="authStore.user?.photoURL">
            <q-img :src="authStore.user.photoURL"/>
            <q-tooltip :delay="2000" anchor="center left" self="center right" class="tooltip-small">You're logged in as {{
                authStore.user?.email
              }}</q-tooltip>
          </q-avatar>
          <q-icon v-else name="o_person" size="20px">
            <q-tooltip :delay="2000" anchor="center left" self="center right" class="tooltip-small">You're logged in as {{
                authStore.user?.email
              }}</q-tooltip>
          </q-icon>

          <q-menu :offset="[0, 7]" fit>
            <q-list dense style="min-width: 150px;min-height:50px">
              <q-item clickable v-close-popup>
                <q-item-section @click="gotoStripe()">Subscriptions</q-item-section>
              </q-item>
              <!--              <q-item clickable v-close-popup>-->
              <!--                <q-item-section @click="subscribe()">Subscribe</q-item-section>-->
              <!--              </q-item>-->
              <q-item clickable v-close-popup>
                <q-item-section @click="logout()">Logout</q-item-section>
              </q-item>
            </q-list>

          </q-menu>
        </span>
        <q-btn v-else
               icon="login"
               :class="rightButtonClass()"
               flat
               color="blue"
               :size="getButtonSize()"
               @click="toggleShowLogin()">
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
import {openURL, uid, useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {useWindowsStore} from "src/stores/windowsStore";
import {useSuggestionsStore} from "stores/suggestionsStore";
import _ from "lodash";
import {SuggestionState} from "src/models/Suggestion";
import SuggestionDialog from "components/dialogues/SuggestionDialog.vue";
import {TabsetStatus} from "src/models/Tabset";
import {ToastType} from "src/models/Toast";
import SidePanelFooterLeftButtons from "components/helper/SidePanelFooterLeftButtons.vue";
import {useAuthStore} from "stores/authStore";
import {Account} from "src/models/Account";
import {useNotificationHandler} from "src/services/ErrorHandler";
import SidePanelLoginWidget from "components/helper/SidePanelLoginWidget.vue";
import SidePanelWindowMarkupTable from "components/helper/SidePanelWindowMarkupTable.vue";
import {Window} from "src/models/Window"

const {handleSuccess, handleError} = useNotificationHandler()

const {inBexMode} = useUtils()

const $q = useQuasar()

const router = useRouter()
const uiStore = useUiStore()
const authStore = useAuthStore()

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const progress = ref<number | undefined>(undefined)
const progressLabel = ref<string | undefined>(undefined)
const showSuggestionButton = ref(false)
const showSuggestionIcon = ref(false)
const doShowSuggestionButton = ref(false)
const transitionGraceTime = ref(false)
const showWindowTable = ref(false)
const showLogin = ref(false)
const account = ref<Account | undefined>(undefined)
const randomKey = ref<string>(uid())

watchEffect(() => {
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  if (useWindowsStore().windowForId(windowId)?.open) {
    //console.log("setting showWindowTable to ", useWindowsStore().windowForId(windowId)?.open)
    showWindowTable.value = useWindowsStore().windowForId(windowId)?.open || false
  }
})

watchEffect(() => {
  account.value = authStore.getAccount()
})

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
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
})

watchEffect(() => {
  progress.value = (uiStore.progress || 0.0) / 100.0
  progressLabel.value = uiStore.progressLabel + " " + Math.round(100 * progress.value) + "%"
})

//const openOptionsPage = () => window.open(chrome.runtime.getURL('www/index.html#/mainpanel/settings'));
//const openOptionsPage = () => window.open('#/mainpanel/settings');
const openOptionsPage = () => {
  ($q.platform.is.cordova || $q.platform.is.capacitor) ?
    //Browser.open({ url: 'http://capacitorjs.com/' }).catch((err) => console.log("error", err)) :
    router.push("/settings") :
    NavigationService.openOrCreateTab([chrome.runtime.getURL('www/index.html#/mainpanel/settings')], undefined, [], true, true)
}

const openExtensionTab = () =>
  //NavigationService.openOrCreateTab([chrome.runtime.getURL('www/index.html#/fullpage')])
  openURL(chrome.runtime.getURL('www/index.html#/fullpage'))

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

const toggleShowLogin = () => showLogin.value = !showLogin.value

const toggleShowWindowTable = () => {
  showWindowTable.value = !showWindowTable.value
  if (showWindowTable.value) {
    randomKey.value = uid()
  }
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  const currentWindow: Window | undefined = useWindowsStore().windowForId(windowId)
  if (currentWindow) {
    currentWindow.open = showWindowTable.value
    useWindowsStore().upsertTabsetWindow(currentWindow)
  }
}

const logout = () => {
  authStore.logout()
    .then(() => {
      router.push("/refresh/sidepanel")
    })
    .catch(() => {
      //this.handleError(error)
    })
    .finally(() => {
      console.log("cleaning up after logout")
      //useTabsetService().init(useDB(undefined).db, useDB(undefined).pouchDb)
    })
}

const subscribe = () => router.push("/subscribe")

const offsetBottom = () => ($q.platform.is.capacitor || $q.platform.is.cordova) ? 'margin-bottom:20px;' : ''

const gotoStripe = () => openURL("https://billing.stripe.com/p/login/test_5kA9EHf2Da596HuaEE")

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
