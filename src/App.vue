<template>
  <router-view/>
</template>

<script setup lang="ts">

//window.global ||= window;

import {LocalStorage, useQuasar} from "quasar";
import AppService from "src/services/AppService";
import {useAuthStore} from "stores/authStore";
import {EventEmitter} from "events";
import {logtail} from "boot/logtail";
import {getAuth, isSignInWithEmailLink, onAuthStateChanged, signInWithEmailLink, UserCredential} from "firebase/auth";
import {CURRENT_USER_EMAIL} from "boot/constants";
import {collection, doc, getDoc, getDocs} from "firebase/firestore";
import {firestore} from "boot/firebase";
import {Account} from "src/models/Account";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {StaticSuggestionIdent, Suggestion} from "src/models/Suggestion";
import {useRouter} from "vue-router";

const $q = useQuasar()
const router = useRouter()

// https://stackoverflow.com/questions/9768444/possible-eventemitter-memory-leak-detected
const emitter = new EventEmitter()
emitter.setMaxListeners(12)

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    console.log("%conAuthStateChanged: logged in", "border:1px solid green")
    useAuthStore().setUser(user)

    getDoc(doc(firestore, "users", user.uid))
      .then(userDoc => {
        //console.log("userDoc", userDoc)
        const userData = userDoc.data()
        console.log("userData", userData)

        const account = new Account(user.uid, userData)

        getDocs(collection(firestore, "users", user.uid, "subscriptions"))
          .then((querySnapshot) => {
            //console.log("querySnapshot", querySnapshot)
            const products = new Set<string>()
            querySnapshot.forEach((doc) => {
              //console.log(doc.id, " => ", doc.data());
              //key += doc.id + "|"
              const subscriptionData = doc.data()
              if (subscriptionData.status === "active") {
                const items = subscriptionData.items
                for (const i of items) {
                  //console.log("checking item", i)
                  if (i.plan.product) {
                    products.add(i.plan.product)
                  }
                }
              }
              account.setProducts(Array.from(products))
              // TODO we do not need to store that much
              //account.addSubscription(subscriptionData)
            })
            useAuthStore().upsertAccount(account)
            useAuthStore().setProducts(Array.from(products))

            //AppService.restart("restarted=true")
            AppService.init($q, router)
          })

      })


  } else {
    // User is signed out
    console.log("%conAuthStateChanged: logged out", "border:1px solid green")
    useAuthStore().setUser(undefined)
    AppService.init($q, router)
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
      console.error("error", error)
      logtail.error("error in email link redirection", error)
      useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.RESTART_SUGGESTED))
    });

}


$q.dark.set($q.localStorage.getItem('darkMode') || false)

AppService.init($q, router)

logtail.info("tabsets started", {
  "mode": process.env.MODE,
  "version": import.meta.env.PACKAGE_VERSION,
})

</script>
