<template>
  <router-view/>
</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore";
import {useQuasar} from "quasar";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {useSearchStore} from "src/stores/searchStore";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useWindowsStore} from "src/stores/windowsStore";
import {useRoute, useRouter} from "vue-router";
import {useAuth0, User} from "@auth0/auth0-vue";
import {ref, watchEffect} from "vue";
import PouchDbPersistenceService from "src/services/PouchDbPersistenceService";
import AppService from "src/services/AppService";
import {useAuthStore} from "stores/auth";
import {useSettingsStore} from "stores/settingsStore";
import {Logz} from "src/services/logz/Logz";
import {EventEmitter} from "events";

const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()
const bookmarksStore = useBookmarksStore()
const windowsStore = useWindowsStore()
const searchStore = useSearchStore()
const route = useRoute()
const $q = useQuasar()
const auth0 = useAuth0()
const authStore = useAuthStore()

// https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
const emitter = new EventEmitter()
emitter.setMaxListeners(12)

// we assume we are authenticated when we reach this point in electron mode
//const isAuthenticated = ref(process.env.MODE === 'electron' ? true : auth0.isAuthenticated)
const isAuthenticated = ref(true)

if (process.env.MODE === 'electron') {
 /* window.electronAPI.getProfile()
      .then((profile: any) => {
        const user = new User()
        user.name = profile.name
        user.email = profile.name
        user.sub = profile.sub
        user.picture = profile.picture
        user.nickname = profile.nickname
        //console.log("setting user", user)
        useAuthStore().setUser(user)

      })*/
}

function isPublicTabsetPage(path: string) {
  return path.startsWith('/publictabsets')
}

$q.dark.set($q.localStorage.getItem('darkMode') || false)

const redirect = ref(true)

watchEffect(() => {
  // TODO improve
  if (process.env.MODE === 'electron') {
    console.log("watching auth effect:", isAuthenticated.value, authStore.user?.name, redirect.value)
    if (redirect.value && isAuthenticated.value && authStore.user?.name) {

      if (!isPublicTabsetPage(route.path)) { // do not login in public pages even if authenticated
        redirect.value = false
        if (auth0.user.value) {
          authStore.setUser(auth0.user.value)
        }
        //console.log("setting auth0", auth0)
        authStore.setAuth0(auth0)

        PouchDbPersistenceService.initRemoteDb()
          .then(() => {
            console.log("calling appService init")
            AppService.init()
          })
        Logz.info({"message": "user logged in (electron)", "username": auth0.user.value?.name})
      }

    }
  } else {
    console.log("watching auth effect:", isAuthenticated.value, auth0.user.value?.name, redirect.value)
   // if (redirect.value && isAuthenticated.value && auth0.user.value?.name) {
    if (redirect.value && isAuthenticated.value ) {

      if (!isPublicTabsetPage(route.path)) { // do not log in in public pages even if authenticated
        redirect.value = false
        //authStore.setUser(auth0.user.value)
        authStore.setAuth0(auth0)

        // PouchDbPersistenceService.initRemoteDb()
        //   .then(() => {
            console.log("calling appService init")
            AppService.init()

            const selectedTSId = localStorage.getItem("selectedTabset")
        //  })
        Logz.info({"message": "user logged in", "username": auth0.user.value?.name})
      }

    }

  }
})

Logz.info({"message": "init: tabsets " + process.env.MODE + ", version: " + import.meta.env.PACKAGE_VERSION, "username": "anonymous"})

</script>
