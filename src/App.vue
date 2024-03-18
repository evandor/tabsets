<template>
  <router-view/>
</template>

<script setup lang="ts">

import {LocalStorage, setCssVar, useQuasar} from "quasar";
import AppService from "src/services/AppService";
import {EventEmitter} from "events";
import {onAuthStateChanged} from "firebase/auth";
import {APP_INSTALLATION_ID, CURRENT_USER_ID} from "boot/constants";
import {useRouter} from "vue-router";
import FirebaseServices from "src/services/firebase/FirebaseServices";
import {useNotificationHandler} from "src/services/ErrorHandler";
import FirestorePersistenceService from "src/services/persistence/FirestorePersistenceService";
import {useUtils} from "src/services/Utils";
import {useLogger} from "src/services/Logger";

const $q = useQuasar()
const router = useRouter()
const {inBexMode} = useUtils()

const {handleError} = useNotificationHandler()
const {info} = useLogger()

// https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
const emitter = new EventEmitter()
emitter.setMaxListeners(12)

if (process.env.USE_FIREBASE == "true") {
  FirebaseServices.init()
}

if (inBexMode()) {

  $q.bex.on('fcm.token.received', ({data, respond}) => {
    console.log('Token received from service worker:', data)
    LocalStorage.set('app.fcmToken', data.token)
    FirestorePersistenceService.updateUserToken(data.token)
    respond('thx')
  })

  $q.bex.on('fb.message.received', async ({data, respond}) => {
    const localInstallationId = LocalStorage.getItem(APP_INSTALLATION_ID) || "";
    console.debug('Message received from service worker:', data, localInstallationId)

    if (data.msg) {
      switch (data.msg) {
        case "event.tabset.updated":
          if (localInstallationId !== data.origin) {
            console.log("reloading tabsets due to remote event", localInstallationId, data)
            //await FirestorePersistenceService.loadSpaces()
            await FirestorePersistenceService.loadTabsets()
          }
          break
        default:
          console.log("unrecognized payload with msg " + data.msg)
      }
    } else {
      console.log("unrecognized payload without msg field")
    }
    respond('thx')
  })
}

if (process.env.USE_FIREBASE == "true") {
  const auth = FirebaseServices.getAuth()
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("%conAuthStateChanged: about to log in", "border:1px solid green")

      // TODO revisit now
      try {
        await AppService.init($q, router, true, user)
        if (inBexMode()) {
          $q.bex.send('auth.user.login', {userId: user.uid})
        }
        //FirebaseServices.startRealtimeDbListeners(user.uid)
      } catch (error: any) {
        console.log("%ccould not initialize appService due to " + error, "background-color:orangered")
        console.error("error", error, typeof error, error.code, error.message)
        handleError(error.code)
        return Promise.resolve()
      }

    } else {
      // User is signed out
      console.log("%conAuthStateChanged: logged out", "border:1px solid green")
      await AppService.init($q, router, true, undefined)
      if (inBexMode()) {
        $q.bex.send('auth.user.logout', {})
      }
      if (!router.currentRoute.value.path.startsWith("/mainpanel")) {
        console.log("NOT redirecting to '/'")
        //await router.push("/")
      }
    }
  });

}

const useDarkMode: string = $q.localStorage.getItem('darkMode') || "auto" as string
if (useDarkMode === "true") {
  $q.dark.set(true)
} else if (useDarkMode === "false") {
  $q.dark.set(false)
} else {
  $q.dark.set("auto")
}

if (useDarkMode === "true") {
  setCssVar('primary', '#D9E8F5');
  setCssVar('secondary', '#26A69A');
  setCssVar('accent', '#9C27B0');
  setCssVar('dark', '#1d1d1d');
  setCssVar('positive', '#21BA45');
  setCssVar('negative', '#C10015');
  setCssVar('info', '#31CCEC');
  setCssVar('separator', '#AA0099');
  // setCssVar('warning', 'green');
}

const currentUser = $q.localStorage.getItem(CURRENT_USER_ID)
if (!process.env.USE_FIREBASE) {
  AppService.init($q, router, false)
} else if (currentUser) {
  console.log("current user id found, waiting for auto-login")
  // we should be logged in any second
} else {
  setTimeout(() => {
    // triggers, but app should already have been started, no restart enforced
    console.debug("app start fallback after 2000ms")
    AppService.init($q, router, false)
  }, 2000)
}


info(`tabsets started: mode=${process.env.MODE}, version=${import.meta.env.PACKAGE_VERSION}`)

// Notification.requestPermission().then((permission) => {
//   if (permission === 'granted') {
//     console.log('Notification permission granted.')
//   }
// })

</script>
