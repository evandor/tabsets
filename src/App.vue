<template>
  <router-view />
</template>

<script setup lang="ts">
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth/web-extension'
import { LocalStorage, setCssVar, useQuasar } from 'quasar'
import AppService from 'src/app/AppService'
import { EXTENSION_NAME, NEW_TAB_EXTENSION_ID } from 'src/boot/constants'
import BexFunctions from 'src/core/communication/BexFunctions'
import { useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useLogger } from 'src/core/services/Logger'
import { useUtils } from 'src/core/services/Utils'
import { useAppStore } from 'src/core/stores/appStore'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { usePermissionsStore } from 'src/core/stores/usePermissionsStore'
import { useFirebaseServices } from 'src/services/firebase/useFirebaseServices'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const version = import.meta.env.PACKAGE_VERSION

const settingsStore = useSettingsStore()
settingsStore.initialize()

// console.log('===', useSettingsStore().isDisabled('noMonitoring'), process.env.GRAFANA_FARO_COLLECTOR_URL as string)
if (useSettingsStore().isDisabled('noMonitoring') && !process.env.DEV) {
  initializeFaro({
    url: process.env.GRAFANA_FARO_COLLECTOR_URL as string,
    app: {
      name: EXTENSION_NAME + '.extension',
      version: version,
      environment: process.env.DEV ? 'development' : 'production',
      namespace: process.env.MODE || 'unknown',
      // _mode: process.env.MODE || 'unknown', _version: version, service_name: EXTENSION_NAME
    },
    trackGeolocation: false,
    instrumentations: [
      // Mandatory, omits default instrumentations otherwise.
      ...getWebInstrumentations(),

      // Tracing package to get end-to-end visibility for HTTP requests.
      new TracingInstrumentation(),
    ],
  })
}

const $q = useQuasar()
const router = useRouter()
const { inBexMode, setupConsoleInterceptor } = useUtils()
const platform = $q.platform
LocalStorage.set('platform', platform)

const { handleError } = useNotificationHandler()

// TODO only in prod?
if (process.env.TABSETS_STAGE !== 'EMULATOR' && process.env.TABSETS_STAGE !== 'DEV') {
  setupConsoleInterceptor(useUiStore())
}

usePermissionsStore().initialize()

useAppStore().init()

const { info } = useLogger()

// FirebaseServices.init()

const auth = useFirebaseServices().firebaseServices.getAuth()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('%conAuthStateChanged: about to log in', 'border:1px solid green', user?.email)

    try {
      await AppService.init($q, router, true, user)
      // info(`tabsets-pro started: mode=${process.env.MODE}, version=${import.meta.env.PACKAGE_VERSION}`)
      //FirebaseServices.startRealtimeDbListeners(user.uid)
    } catch (error: any) {
      console.log('%ccould not initialize appService due to ' + error, 'background-color:orangered')
      console.error('error', error, typeof error, error.code, error.message)
      handleError(error.code)
      return Promise.resolve()
    }
  } else {
    // User is signed out
    console.log('%conAuthStateChanged: logged out', 'border:1px solid green')
    if (inBexMode()) {
      // if (!(route.fullPath.startsWith('/pwa/imp/') || route.fullPath.startsWith('/mainpanel/login'))) {
      //   const welcomePageHasBeenShown = LocalStorage.getItem('ui.welcomepro.shown') as boolean
      //   if (welcomePageHasBeenShown) {
      //     await router.push('/sidepanel/login')
      //   } else {
      //     console.log('redirecting to /sidepanel/welcomepro')
      //     await router.push('/popup/welcome')
      //   }
      // }
    } else {
      const auth = getAuth()
      signInAnonymously(auth)
        .then((user: any) => {
          console.log('logged in anonymously', user)
        })
        .catch((err: any) => {
          console.warn('error logging ')
        })
    }
  }
})

// let useDarkMode: string = $q.localStorage.getItem('darkMode') || ('auto' as string)
//
// if ($q.platform.is.safari && !$q.platform.is.bex) {
//   console.log('switching dark mode default to false on safari non-bex')
//   useDarkMode = $q.localStorage.getItem('darkMode') || ('false' as string)
// }
//
// if (useDarkMode === 'true') {
//   $q.dark.set(true)
// } else if (useDarkMode === 'false') {
//   $q.dark.set(false)
// } else {
//   $q.dark.set('auto')
// }
//
// if (useDarkMode === 'true') {
//   setCssVar('primary', '#D9E8F5')
//   setCssVar('secondary', '#26A69A')
//   setCssVar('accent', '#9C27B0')
//   setCssVar('dark', '#1d1d1d')
//   setCssVar('positive', '#21BA45')
//   setCssVar('negative', '#C10015')
//   setCssVar('info', '#31CCEC')
//   setCssVar('separator', '#AA0099')
//   // setCssVar('text-xxx', '#AA0099')
//   // setCssVar('warning', 'green');
// }

const fontsize = useUiStore().fontsize
useUiStore().setFontsize(fontsize)

AppService.init($q, router)

info(`${EXTENSION_NAME} started`)

if (inBexMode()) {
  $q.bex.on('tabsets.bex.tab.excerpt', BexFunctions.handleBexTabExcerpt)
  onBeforeUnmount(() => {
    $q.bex.off('tabsets.bex.tab.excerpt', BexFunctions.handleBexTabExcerpt)
  })
  $q.bex.on('reload-current-tabset', BexFunctions.handleReload)
  onBeforeUnmount(() => {
    $q.bex.off('reload-current-tabset', BexFunctions.handleReload)
  })
}

// newtab extension installed?
//console.log('checkin', NEW_TAB_EXTENSION_ID)
// try {
//   chrome.runtime.sendMessage(NEW_TAB_EXTENSION_ID, { message: 'getVersion' }, function (response) {
//     //console.log('testing for newtab extension', response)
//     if (response) {
//       console.log('newtab is installed')
//       LocalStorage.setItem('ui.newtab.installed', true)
//     } else if (chrome.runtime.lastError) {
//       LocalStorage.setItem('ui.newtab.installed', false)
//       /* ignore */
//     }
//     // if (targetInRange(response.targetData))
//     //chrome.runtime.sendMessage('bafapaeaebbfoobjakidbomlnpfcfakn', { activateLasers: true })
//   })
// } catch (error) {
//   console.debug("can't check for newtab extension", error)
// }
</script>
