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
import {getAuth, isSignInWithEmailLink, onAuthStateChanged, signInWithEmailLink, UserCredential} from "firebase/auth";
import {CURRENT_USER_EMAIL} from "boot/constants";
import {collection, doc, getDoc, getDocs} from "firebase/firestore";
import {firestore} from "boot/firebase";
import {Account} from "src/models/Account";
import GitPersistentService from "src/services/persistence/GitPersistentService";

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

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    console.log("onAuthStateChanged: logged in")
    useAuthStore().setUser(user)

    getDoc(doc(firestore, "users", user.uid))
      .then(userDoc => {
        console.log("userDoc", userDoc)
        const userData = userDoc.data()
        console.log("userData", userData)

        const account = new Account(user.uid, userData)

        getDocs(collection(firestore, "users", user.uid, "subscriptions"))
          .then((querySnapshot) => {
            console.log("querySnapshot", querySnapshot)
            const products = new Set<string>()
            querySnapshot.forEach((doc) => {
              console.log(doc.id, " => ", doc.data());
              //key += doc.id + "|"
              const subscriptionData = doc.data()
              if (subscriptionData.status === "active") {
                const items = subscriptionData.items
                for (const i of items) {
                  console.log("checking item", i)
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

            //GitPersistentService.init(syncType, syncUrl)
            //AppService.init()

          })

      })


  } else {
    // User is signed out
    console.log("onAuthStateChanged: logged out")
    useAuthStore().setUser(undefined)
  }
});

if (isSignInWithEmailLink(auth, window.location.href)) {

  console.log("%cfound sign-in-with-email-link location", window.location.href)

  const emailForSignIn = LocalStorage.getItem(CURRENT_USER_EMAIL)

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
    console.log("watching auth effect:", isAuthenticated.value, redirect.value)
    if (redirect.value && isAuthenticated.value && authStore.user?.name) {

      redirect.value = false
      if (auth0.user.value) {
        //authStore.setUser(auth0.user.value)
      }
      //console.log("setting auth0", auth0)
      //authStore.setAuth0(auth0)

      PouchDbPersistenceService.initRemoteDb()
        .then(() => {
          console.log("calling appService init")
          AppService.init()
        })
     // Logz.info({"message": "user logged in (electron)", "username": auth0.user.value?.name})

    }
  } else {
    console.debug("watching auth effect:", isAuthenticated.value,  redirect.value)
    // if (redirect.value && isAuthenticated.value && auth0.user.value?.name) {
    if (redirect.value && isAuthenticated.value) {

      redirect.value = false
      //authStore.setUser(auth0.user.value)
      //authStore.setAuth0(auth0)

      AppService.init()

      const selectedTSId = localStorage.getItem("selectedTabset")
      //  })
      //Logz.info({"message": "user logged in", "username": auth0.user.value?.name})

      logtail.info("user logged in", {"username": "unknown"})

    }

  }
})

logtail.info("tabsets started", {
  "mode": process.env.MODE,
  "version": import.meta.env.PACKAGE_VERSION,
})

</script>
