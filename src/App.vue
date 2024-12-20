<template>
  <router-view />
</template>

<script setup lang="ts">

import { setCssVar, useQuasar } from 'quasar'
import AppService from 'src/app/AppService'
import { EventEmitter } from 'events'
import { useRouter } from 'vue-router'
import { useLogger } from 'src/services/Logger'
import { useSettingsStore } from 'src/stores/settingsStore'
import { useAppStore } from 'src/stores/appStore'
import { usePermissionsStore } from 'src/core/stores/usePermissionsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onBeforeUnmount } from 'vue'
import BexFunctions from 'src/core/communication/BexFunctions'

const $q = useQuasar()
const router = useRouter()

const settingsStore = useSettingsStore()
settingsStore.initialize($q.localStorage)
console.debug('')

usePermissionsStore().initialize()
console.debug('')

useAppStore().init()

const { info } = useLogger()

// https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
const emitter = new EventEmitter()
emitter.setMaxListeners(12)

let useDarkMode: string = $q.localStorage.getItem('darkMode') || 'auto' as string

if ($q.platform.is.safari && !$q.platform.is.bex) {
  console.log('switching dark mode default to false on safari non-bex')
  useDarkMode = $q.localStorage.getItem('darkMode') || 'false' as string
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

  // $body-font-size   : var(--q-theme-font-size, 20px);
  // $body-line-height : var(--q-theme-line-height, 1.2);
  // $typography-font-family: var(--q-theme-font-family, "'Roboto', '-apple-system', 'Helvetica Neue', Helvetica, Arial, sans-serif");
  // $button-font-size: var(--q-theme-btn-font-size, 16px);
}

const fontsize = useUiStore().fontsize
useUiStore().setFontsize(fontsize)

AppService.init($q, router, false)

info(`tabsets started: mode=${process.env.MODE}, version=${import.meta.env.PACKAGE_VERSION}`)

// const doOnTabOpened = (data: object) => {
//   console.log('[BEX-APP] tabsets.bex.tab <<<', data)
// }
// $q.bex.on('tabsets.bex.tab.updated', doOnTabOpened)
// onBeforeUnmount(() => {
//   $q.bex.off('tabsets.bex.tab.updated', doOnTabOpened)
// })

// $q.bex.on('@quasar:ports', ({ from, to, event, payload }:{from:string, to:string, event: string, payload:object}) => {
// // $q.bex.on('@quasar:ports', (data:object) => {
//   console.log('[BEX-APP] Ports:::', from, to, event,payload)
//   if (payload['added' as keyof object]) {
//     console.log('[BEX-APP] New connection:', payload['added' as keyof object])
//   } else if (payload['removed' as keyof object]) {
//     console.log('[BEX-APP] Connection removed:', payload['removed' as keyof object])
//   }
// })
// // TODO off

// function setupBexCommunication(excerpt: string, handleBexTabExcerpt: ({ from, to, event, payload }: {
//   from: string;
//   to: string;
//   event: string;
//   payload: object
// }) => Promise<void>) {
//
// }
//
// setupBexCommunication('tabsets.bex.tab.excerpt', BexFunctions.handleBexTabExcerpt)

$q.bex.on('tabsets.bex.tab.excerpt', BexFunctions.handleBexTabExcerpt)
onBeforeUnmount(() => {
  $q.bex.off('tabsets.bex.tab.excerpt', BexFunctions.handleBexTabExcerpt)
})

</script>
