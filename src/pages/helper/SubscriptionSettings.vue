<template>
  <div class="q-pa-md q-gutter-sm">
    <q-banner rounded class="bg-grey-1 text-primary" style="border: 1px solid orange">
      <div class="text-body1">Experimental: Subscribe to Tabsets Pro Features.</div>
      <div class="text-caption">
        Some features need a subscription.<br><br>
        <span class="text-red">This is not working yet. No fees will be charged.</span>
      </div>
      <div class="caption">
        Pro Features will include
        <ul>
          <li>Managed Synchronization</li>
          <li>PDF Creation</li>
          <li>todo...</li>
        </ul>
      </div>
    </q-banner>
  </div>

  <div class="row items-baseline q-ma-md q-gutter-lg">

    <div class="col-3">
      Authorize to subscribe or check your subscriptions
    </div>
    <div class="col-5">
      <q-btn label="GitHub" @click="authorizeWith(githubAuthProvider)"/>
      <q-btn label="GitLab" @click="authorizeWith(githubAuthProvider)"/>
    </div>
    <div class="col">
      Authorized as: {{ useAuthStore().user?.email || '---' }}
    </div>

    <!--    <div class="col-3">-->
    <!--      Claims-->
    <!--    </div>-->
    <!--    <div class="col-6">-->
    <!--      {{ claims }}-->
    <!--    </div>-->
    <!--    <div class="col">-->

    <!--    </div>-->


    <template v-if="claims">
      <div class="col-3">
        Subscription key
      </div>
      <div class="col-7">
        <q-btn label="Show Key" @click="getSubscriptionKey()"/>
      </div>
      <div class="col"></div>
    </template>

    <div class="col-3">
      Subscription
    </div>
    <div class="col-7">
      <q-btn label="Subscribe" @click="subscribe()"/>
    </div>
    <div class="col"></div>

    <template v-if="subscription">
      <div class="col-3">
        Subscription Key
      </div>
      <div class="col-7">
        <q-input readonly type="text" color="primary" filled v-model="subscription" label="">
          <template v-slot:prepend>
            <q-icon name="o_shopping_bag"/>
          </template>
        </q-input>
      </div>
      <div class="col" v-if="subscription">
        <a href="https://billing.stripe.com/p/login/test_5kA9EHf2Da596HuaEE" target="_blank">Portal</a>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>

import {ref, watchEffect, onMounted} from "vue";
import {LocalStorage, openURL} from "quasar";
import {SUBSCRIPTION_ID_IDENT} from "boot/constants";
import {FirebaseCall} from "src/services/firebase/FirebaseCall";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {firebaseApp, githubAuthProvider, firestore} from "boot/firebase";
import {createUserWithEmailAndPassword, signInWithPopup, UserCredential} from "firebase/auth";
import {useUtils} from "src/services/Utils";
import {getFirestore} from "firebase/firestore";
import {collection, setDoc, doc, getDocs} from "firebase/firestore";
import userHasClaim from "src/services/stripe/isUserPremium";
import {createCheckoutSession} from "src/services/stripe/createCheckoutSession";
import {useAuthStore} from "stores/authStore";

const {inBexMode} = useUtils()

const subscription = ref<string | undefined>()

const userCredentials = ref<UserCredential | undefined>(undefined)
const claims = ref<object | undefined>(undefined)

watchEffect(async () => {
  //const user = getAuth().currentUser
  if (userCredentials.value) {
    console.log("user!", userCredentials.value)
    claims.value = await userHasClaim('githubsync')
  }
})

watchEffect(() => {
  (subscription.value && subscription.value.trim().length > 0) ?
    LocalStorage.set(SUBSCRIPTION_ID_IDENT, subscription.value) :
    LocalStorage.remove(SUBSCRIPTION_ID_IDENT)
})


const subscribe = async () => {
  if (useAuthStore().isAuthenticated()) {
    console.log("xxx", useAuthStore().user.uid)
    await createCheckoutSession(useAuthStore().user.uid)
  }
}

const authorizeWith = async (githubAuthProvider:any) => {
  const auth = getAuth(firebaseApp);
  console.log("auth", auth)
  //createUserWithEmailAndPassword(auth, "email", "password")
  const credentials: UserCredential = await signInWithPopup(auth, githubAuthProvider)
  console.log("userCredentials", credentials)
  console.log("userCredentials", {...credentials.user})
  userCredentials.value = credentials

  try {
    await setDoc(doc(firestore, "users", credentials.user.uid), {
      uid: credentials.user.uid,
      email: credentials.user.email,
      name: credentials.user.displayName,
      provider: credentials.user.providerData[0].providerId,
      photoUrl: credentials.user.photoURL
    });
    //console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }

}

const getSubscriptionKey = async () => {
  console.log("getting subscription key", claims.value)
  const querySnapshot = await getDocs(collection(firestore, "users", userCredentials.value.user.uid, "subscriptions"))
  console.log("querySnapshot", querySnapshot)
  let key = ""
  if (claims.value) {
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      key += doc.id + "|"
    })
    subscription.value = key
  } else {
    subscription.value = undefined
  }
}

</script>
