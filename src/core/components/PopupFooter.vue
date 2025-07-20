<template>
  <q-footer class="q-pa-none q-mt-sm darkInDarkMode brightInBrightMode" style="border-top: 1px solid lightgrey">
    <div class="row fit q-ma-none q-pa-none" v-if="!checkToasts() && useUiStore().progress">
      <div class="col-12">
        <q-linear-progress stripe size="18px" :value="progressValue" color="warning" track-color="grey-4">
          <div class="absolute-full flex flex-center">
            <q-badge :label="progressLabel" color="white" text-color="primary" />
          </div>
        </q-linear-progress>
      </div>
    </div>

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

    <div v-else class="row fit q-ma-none q-pa-none">
      <div class="col-6 q-ml-xs">
        <q-btn
          v-if="useFeaturesStore().hasFeature(FeatureIdent.OPEN_TABS)"
          icon="sym_o_tabs"
          class="q-my-xs q-px-xs q-mr-none"
          flat
          color="grey-7"
          size="12px"
          @click="toggleOpenTabsView()">
          <q-tooltip class="tooltip-small">All your browser's current open tabs</q-tooltip>
        </q-btn>
      </div>
      <div class="col text-right">
        <q-btn
          icon="o_settings"
          color="grey"
          flat
          size="md"
          style="max-width: 32px"
          @click="goto('/popup/settings')"
          class="cursor-pointer" />
        <q-btn
          v-if="!sidepanelEnabled"
          icon="open_in_new"
          color="grey"
          flat
          size="md"
          style="max-width: 32px"
          @click="openBrowserSidepanel()"
          class="cursor-pointer">
          <q-tooltip>open Sidepanel</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-footer>
</template>

<script setup lang="ts">
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { ToastType } from 'src/core/models/Toast'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const { openSidepanel } = useUtils()

const router = useRouter()
const sidepanelEnabled = ref(false)
const opentabsView = ref(false)

const progressValue = ref<number>(0.0)
const progressLabel = ref<string>('')

if (chrome.sidePanel) {
  // chrome.tabs.query({ active: true, lastFocusedWindow: true }).then((ts: chrome.tabs.Tab[]) => {
  //   console.log('got', ts)
  //   if (ts.length > 0 && ts[0]!.id) {

  chrome.runtime.getContexts({}, (ctxs: object[]) => {
    //console.log('ctxs', ctxs)
    sidepanelEnabled.value = ctxs.filter((c: object) => 'SIDE_PANEL' === c['contextType' as keyof object]).length > 0
    // console.log('sidepanelEnabled', sidepanelEnabled.value)
  })

  watchEffect(() => {
    const uiProgress = useUiStore().progress
    if (uiProgress) {
      progressValue.value = (uiProgress['val' as keyof object] as number) || 0.0
      progressLabel.value = uiProgress['label' as keyof object] || ''
      //console.log("we are here", progressValue.value)
    }
  })

  // chrome.sidePanel
  //   // .getOptions({ tabId: ts[0]!.id })
  //   .getOptions({})
  //   .then((options: any) => {
  //     console.log('got options', options.enabled, options)
  //     sidepanelEnabled.value = options ? options.enabled : false
  //   })
  //   .catch((err) => console.log('err', err))
  // // }
  // // })
}

const checkToasts = () => {
  if (useUiStore().toasts.length > 0) {
    const useDelay = 3000
    useUiStore().delayedToastRemoval(useDelay)
    // const oldShowButton = showSuggestionButton.value
    // const oldDoShowButton = doShowSuggestionButton.value
    // transitionGraceTime.value = true
    // showSuggestionButton.value = false
    // doShowSuggestionButton.value = false
    // setTimeout(() => {
    //   if (useUiStore().toasts.length === 0) {
    //     // only if all toasts are gone
    //     transitionGraceTime.value = false
    //     showSuggestionButton.value = oldShowButton
    //     doShowSuggestionButton.value = oldDoShowButton
    //   }
    // }, useDelay + 1100) // must be higher than css value in fade-leave-active

    return true
  }
  return false
}

const toastBannerClass = () => {
  const defaults = ' text-white q-py-none'
  switch (useUiStore().toasts[0]?.type) {
    case ToastType.INFO:
      return 'bg-positive' + defaults
    case ToastType.WARNING:
      return 'bg-warning' + defaults
    case ToastType.ERROR:
      return 'bg-negative' + defaults
    case ToastType.CHOICE:
      return 'bg-grey-3 text-primary q-py-none'
    default:
      return 'bg-negative' + defaults
  }
}

const openBrowserSidepanel = async () => {
  openSidepanel().then(() => {
    sidepanelEnabled.value = !sidepanelEnabled.value
    window.close()
  })
}

const goto = (path: string) => router.push(path)

const toggleOpenTabsView = () => {
  console.log('clicked')
  opentabsView.value = !opentabsView.value
  if (opentabsView.value) {
    router.push('/popup/opentabs')
  } else {
    router.push('/popup')
  }
}
</script>
