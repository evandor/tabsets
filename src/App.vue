<template>
  <router-view />
</template>

<script setup lang="ts">
import { EXTENSION_NAME, NEW_TAB_EXTENSION_ID } from 'boot/constants'
import { LocalStorage, setCssVar, useQuasar } from 'quasar'
import AppService from 'src/app/AppService'
import BexFunctions from 'src/core/communication/BexFunctions'
import { useUtils } from 'src/core/services/Utils'
import { usePermissionsStore } from 'src/core/stores/usePermissionsStore'
import { useLogger } from 'src/services/Logger'
import { useAppStore } from 'src/stores/appStore'
import { useSettingsStore } from 'src/stores/settingsStore'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()
const { inBexMode, setupConsoleInterceptor } = useUtils()

// TODO only in prod?
if (process.env.TABSETS_STAGE !== 'DEV') {
  setupConsoleInterceptor(useUiStore())
}

const settingsStore = useSettingsStore()
settingsStore.initialize($q.localStorage)

usePermissionsStore().initialize()

useAppStore().init()

const { info } = useLogger()

// // https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
// const emitter = new EventEmitter()
// emitter.setMaxListeners(12)

let useDarkMode: string = $q.localStorage.getItem('darkMode') || ('auto' as string)

if ($q.platform.is.safari && !$q.platform.is.bex) {
  console.log('switching dark mode default to false on safari non-bex')
  useDarkMode = $q.localStorage.getItem('darkMode') || ('false' as string)
}

if (useDarkMode === 'true') {
  $q.dark.set(true)
} else if (useDarkMode === 'false') {
  $q.dark.set(false)
} else {
  $q.dark.set('auto')
}

if (useDarkMode === 'true') {
  setCssVar('primary', '#D9E8F5')
  setCssVar('secondary', '#26A69A')
  setCssVar('accent', '#aab9df')
  setCssVar('dark', '#1d1d1d')
  setCssVar('positive', '#21BA45')
  setCssVar('negative', '#C10015')
  setCssVar('info', '#31CCEC')
  setCssVar('separator', '#AA0099')
  // setCssVar('warning', 'green');
}

const fontsize = useUiStore().fontsize
useUiStore().setFontsize(fontsize)

AppService.init($q, router)

info(`${EXTENSION_NAME} started: mode=${process.env.MODE}, version=${import.meta.env.PACKAGE_VERSION}`)

if (inBexMode()) {
  $q.bex.on('tabsets.bex.tab.excerpt', BexFunctions.handleBexTabExcerpt)
  onBeforeUnmount(() => {
    $q.bex.off('tabsets.bex.tab.excerpt', BexFunctions.handleBexTabExcerpt)
  })
  $q.bex.on('reload-current-tabset', async ({ payload }: { payload: object }) => {
    // const tsId = await useTabsetsStore().getCurrentTabsetId()
    console.log('!!!!!!', payload['tab' as keyof object])
    const currentTabset = useTabsetsStore().getCurrentTabset
    if (currentTabset) {
      const index = currentTabset.tabs.findIndex((tab: Tab) => tab.id === payload['tab' as keyof object]['id'])
      console.log('found index', index)
      if (index >= 0) {
        currentTabset.tabs[index] = payload['tab' as keyof object] as Tab
      }
    }
    await useTabsetService().saveCurrentTabset()

    // const ts = await useTabsetsStore().reloadTabset(tsId!)
    // console.log('ts', ts)
  })
  // onBeforeUnmount(() => {
  //   $q.bex.off('tabsets.bex.tab.excerpt', BexFunctions.handleBexTabExcerpt)
  // })
}

// newtab extension installed?
console.log('checkin', NEW_TAB_EXTENSION_ID)
chrome.runtime.sendMessage(NEW_TAB_EXTENSION_ID, { message: 'getVersion' }, function (response) {
  console.log('testing for newtab extension', response)
  if (response) {
    console.log('newtab is installed')
    LocalStorage.setItem('ui.newtab.installed', true)
  } else if (chrome.runtime.lastError) {
    LocalStorage.setItem('ui.newtab.installed', false)
    /* ignore */
  }
  // if (targetInRange(response.targetData))
  //chrome.runtime.sendMessage('bafapaeaebbfoobjakidbomlnpfcfakn', { activateLasers: true })
})

chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
  // if (sender.id === "oeocceffjkjgiljgelllkaddapnaafgn") { // tabsets.net
  //   if (request.message === "getVersion") {
  //     sendResponse({version: "0.0.1"});
  //   } else if (request.message === "setTabset") {
  //     useTabsetsStore().setTabset( request.tabset)
  //     sendResponse({message: "done"});
  //   }
  //   // sendResponse({version: import.meta.env.PACKAGE_VERSION});
  // }
  console.log('request:', request)
  console.log('sender:', sender)
})
</script>
