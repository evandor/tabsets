<template>
  <router-view/>
</template>

<script setup lang="ts">

import {LocalStorage, setCssVar, useQuasar} from "quasar";
import AppService from "src/services/AppService";
import {useAuthStore} from "stores/authStore";
import {EventEmitter} from "events";
import {logtail} from "boot/logtail";
import {getAuth, isSignInWithEmailLink, onAuthStateChanged, signInWithEmailLink, UserCredential} from "firebase/auth";
import {CURRENT_USER_EMAIL, CURRENT_USER_ID} from "boot/constants";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {StaticSuggestionIdent, Suggestion} from "src/models/Suggestion";
import {useRoute, useRouter} from "vue-router";
import {collection, doc, getDoc, getDocs} from "firebase/firestore";
import {firestore} from "boot/firebase";
import {Account, UserData} from "src/models/Account";

const $q = useQuasar()
const router = useRouter()

// https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
const emitter = new EventEmitter()
emitter.setMaxListeners(12)

const auth = getAuth();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    console.log("%conAuthStateChanged: about to log in", "border:1px solid green")

    // --- if we do this in useAuthStore.setUser(), we cannot properly run vitest anymore (!?!)
    const userDoc = await getDoc(doc(firestore, "users", user.uid))
    const userData = userDoc.data() as UserData
    const account = new Account(user.uid, userData)
    console.log("created account object", account)
    const querySnapshot = await getDocs(collection(firestore, "users", user.uid, "subscriptions"))
    const products = new Set<string>()
    querySnapshot.forEach((doc) => {
      const subscriptionData = doc.data()
      if (subscriptionData.data && subscriptionData.data.metadata) {
        products.add(subscriptionData.data.metadata.product)
      }
      account.setProducts(Array.from(products))
      //console.log("hier", account, products)
    })
    // --- end of statement

    try {
      await AppService.init($q, router, true, user, account)
    } catch (err) {
      console.log("%ccould not initialize appService due to " + err, "background-color:orangered")
      return Promise.resolve()
    }

  } else {
    // User is signed out
    console.log("%conAuthStateChanged: logged out", "border:1px solid green")
    await AppService.init($q, router, true, undefined)
    if (!router.currentRoute.value.path.startsWith("/mainpanel")) {
      console.log("NOT redirecting to '/'")
      //await router.push("/")
    }
  }
});

if (isSignInWithEmailLink(auth, window.location.href)) {

  console.log("%cfound sign-in-with-email-link location", window.location.href)

  const emailForSignIn = LocalStorage.getItem(CURRENT_USER_EMAIL) as string

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
      console.error("error in email link redirection", error)
      logtail.error("error in email link redirection", error)
      useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.RESTART_SUGGESTED))
    });

}

const useDarkMode: string = $q.localStorage.getItem('darkMode') || "false" as string
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
if (currentUser) {
  console.log("current user id found, waiting for auto-login")
  // we should be logged in any second
} else {

  setTimeout(() => {
    // triggers, but app should already have been started, no restart enforced
    console.debug("app start fallback after 2000ms")
    AppService.init($q, router, false)
  }, 2000)


}


logtail.info("tabsets started", {
  "mode": process.env.MODE,
  "version": import.meta.env.PACKAGE_VERSION,
})

</script>
