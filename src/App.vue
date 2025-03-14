<template>
  <router-view />
</template>

<script setup lang="ts">
import { EXTENSION_NAME } from 'boot/constants'
import { setCssVar, useQuasar } from 'quasar'
import AppService from 'src/app/AppService'
import BexFunctions from 'src/core/communication/BexFunctions'
import { useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useUtils } from 'src/core/services/Utils'
import { usePermissionsStore } from 'src/core/stores/usePermissionsStore'
import { useLogger } from 'src/services/Logger'
import { useAppStore } from 'src/stores/appStore'
import { useSettingsStore } from 'src/stores/settingsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const { inBexMode } = useUtils()

const { handleError } = useNotificationHandler()

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
}
</script>
