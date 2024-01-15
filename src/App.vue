<template>
  <router-view/>
</template>

<script setup lang="ts">
import {LocalStorage, useQuasar} from "quasar";
import {useAuth0, User} from "@auth0/auth0-vue";
import {ref, watchEffect} from "vue";
import PouchDbPersistenceService from "src/services/PouchDbPersistenceService";
import AppService from "src/services/AppService";
import {useAuthStore} from "stores/authStore";
import {Logz} from "src/services/logz/Logz";
import {EventEmitter} from "events";
import {logtail} from "boot/logtail";
import {getAuth, isSignInWithEmailLink, signInWithEmailLink, UserCredential} from "firebase/auth";

const $q = useQuasar()
const auth0 = useAuth0()
const authStore = useAuthStore()

// https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
const emitter = new EventEmitter()
emitter.setMaxListeners(12)

// we assume we are authenticated when we reach this point in electron mode
//const isAuthenticated = ref(process.env.MODE === 'electron' ? true : auth0.isAuthenticated)
const isAuthenticated = ref(true)

const auth = getAuth();

if (isSignInWithEmailLink(auth, window.location.href)) {

  console.log("%cfound sign-in-with-email-link location", window.location.href)

  const emailForSignIn = LocalStorage.getItem("emailForSignIn")

  console.log(">>> isSignInWithEmailLink", emailForSignIn)
  signInWithEmailLink(auth, emailForSignIn, window.location.href)
    .then((result: UserCredential) => {
      console.log(">>> result", result)
      //chrome.runtime.sendMessage({ type: 'SET_EMAIL_FOR_SIGN_IN', "email":"email" });
      useAuthStore().setUser(result.user)
      //useAuthStore().authenticated = true


      logtail.info("found email link redirection")
    })
    .catch((error) => {
      console.error("error", error)
      logtail.error("error in email link redirection", error)
      alert(error)
    });

}

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

$q.dark.set($q.localStorage.getItem('darkMode') || false)

const redirect = ref(true)

watchEffect(() => {
  // TODO improve
  if (process.env.MODE === 'electron') {
    console.log("watching auth effect:", isAuthenticated.value, authStore.user?.name, redirect.value)
    if (redirect.value && isAuthenticated.value && authStore.user?.name) {

      redirect.value = false
      if (auth0.user.value) {
        authStore.setUser(auth0.user.value)
      }
      //console.log("setting auth0", auth0)
      //authStore.setAuth0(auth0)

      PouchDbPersistenceService.initRemoteDb()
        .then(() => {
          console.log("calling appService init")
          AppService.init()
        })
      Logz.info({"message": "user logged in (electron)", "username": auth0.user.value?.name})

    }
  } else {
    console.debug("watching auth effect:", isAuthenticated.value, auth0.user.value?.name, redirect.value)
    // if (redirect.value && isAuthenticated.value && auth0.user.value?.name) {
    if (redirect.value && isAuthenticated.value) {

      redirect.value = false
      //authStore.setUser(auth0.user.value)
      //authStore.setAuth0(auth0)

      AppService.init()

      const selectedTSId = localStorage.getItem("selectedTabset")
      //  })
      //Logz.info({"message": "user logged in", "username": auth0.user.value?.name})

      logtail.info("user logged in", {"username": auth0.user.value?.name})

    }

  }
})

logtail.info("tabsets started", {
  "mode": process.env.MODE,
  "version": import.meta.env.PACKAGE_VERSION,
})

</script>
