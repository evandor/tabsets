<template>
  <div class="q-pa-md q-gutter-sm">
    <q-banner rounded  style="border: 1px solid orange">
      <div class="text-body1">Experimental: Subscribe to Tabsets Pro Features.</div>
      <div class="text-caption">
        Some features need a subscription.<br><br>
        <span class="text-red">This is not working yet. No fees will be charged.</span>
      </div>
      <div class="caption">
        Pro Features will include
        <ul>
          <li>Managed Synchronization</li>
          <li>todo...</li>
        </ul>
      </div>
    </q-banner>
  </div>

  <div class="q-pa-md q-mt-xl row items-start justify-center q-gutter-md">

    <PricingCard>
      <template v-slot:overline>For your personal use</template>
      <template v-slot:title>Basic</template>
      <template v-slot:price>&nbsp;</template>
      <template v-slot:teaser>
        Use the Tabsets Browser Extension in your browser
      </template>
      <template v-slot:features>
        <div class="text-subtitle2 q-mb-md">
          <q-icon name="shim" class="q-mr-sm"/>
          Manage
        </div>
        <PlanFeature :features="['tabsets', 'bookmarks', 'local in browser']"/>
      </template>
      <template v-slot:actions>
        <q-btn color="grey-5" disable style="width:200px;">
          Already got it
        </q-btn>
      </template>
    </PricingCard>

    <PricingCard>
      <template v-slot:overline>Support Tabsets</template>
      <template v-slot:title>Free</template>
      <template v-slot:price>0 &euro; <span class="text-body1">/month</span></template>
      <template v-slot:teaser>
        Create an account to show your support for tabsets.
      </template>
      <template v-slot:features>
        <div class="text-subtitle2 q-mb-md">
          <q-icon name="shim" class="q-mr-sm"/>
          As in 'Basic', plus
        </div>
        <PlanFeature :features="['share tabsets publicly','optional newsletter','feature request form','access to experimental features']"/>
      </template>
      <template v-slot:actions>
        <q-btn v-if="!useAuthStore().isAuthenticated"
               color="primary" class="cursor-pointer" style="width:200px;" @click="router.push('/login')">
          Sign up for free
        </q-btn>
        <q-btn v-else color="grey-5" disable style="width:200px;">
          Already got it
        </q-btn>
      </template>
    </PricingCard>

    <PricingCard>
      <template v-slot:overline>Getting more serious</template>
      <template v-slot:title>Sync</template>
      <template v-slot:price>1,99 &euro; <span class="text-body1">/month</span></template>
      <template v-slot:teaser>
        Synchronize your tabsets across browsers and computers.
      </template>
      <template v-slot:features>
        <div class="text-subtitle2 q-mb-md">
          <q-icon name="shim" class="q-mr-sm"/>
          As in 'Free', plus
        </div>
        <PlanFeature :features="['synchronized tabsets','PDF generation']"/>
      </template>
      <template v-slot:actions>
        <q-btn color="primary" class="cursor-pointer" style="width:200px;" @click="openPaymentLink()">
          Choose SYNC
        </q-btn>
      </template>
    </PricingCard>

    <PricingCard>
      <template v-slot:overline>Collaborate</template>
      <template v-slot:title>Pro</template>
      <template v-slot:price><span class="text-body1">not yet available</span></template>
      <template v-slot:teaser>
        Collaborate with your team. Synchronize and Share your tabsets.
      </template>
      <template v-slot:features>
        <div class="text-subtitle2 q-mb-md">
          <q-icon name="shim" class="q-mr-sm"/>
          As in 'Sync', plus
        </div>
        <PlanFeature :features="['offline access','AI features']"/>
      </template>
      <template v-slot:actions>
        <q-btn color="primary" disable style="width:200px;">
          Choose SYNC
        </q-btn>
      </template>
    </PricingCard>


  </div>

  <div class="row items-baseline q-ma-md q-gutter-lg">

<!--    <div class="col-3">-->
<!--      Authorize to subscribe or check your subscriptions-->
<!--    </div>-->
<!--    <div class="col-5">-->
<!--      <q-btn label="GitHub" @click="authorizeWith(githubAuthProvider)"/>-->
<!--    </div>-->
<!--    <div class="col">-->
<!--      Authorized as: {{ userCredentials?.user.email || '-&#45;&#45;' }}-->
<!--    </div>-->

    <div class="col-3">
      Logged in as
    </div>
    <div class="col-7">
      {{ useAuthStore().user?.email || '---'}}
    </div>
    <div class="col"></div>

    <template v-if="!emailVerified && useAuthStore().isAuthenticated()">
    <div class="col-3">
      Please verify your email first
    </div>
    <div class="col-7">
      <q-btn label="Verify" @click="verifyEmail()"/>
    </div>
    <div class="col"></div>
    </template>

    <template v-if="!subscription">
      <div class="col-3">
        Subscribe (delete)
      </div>
      <div class="col-7">
<!--        <q-btn label="Subscribe" @click="subscribe()" :disable="!emailVerified" :class="emailVerified ? '':'text-grey-5'"/>-->



      </div>
      <div class="col">{{ claims }}</div>
      <div class="col-3"></div>
      <div class="col-7 text-caption">
        Click here to get redirected to the available plans.
      </div>
    </template>
    <template v-else>
      <div class="col-3">
        Subscription (Git Synchronization)
      </div>
      <div class="col-7">
        <q-btn label="Test Subscription" @click="testSubscription()"/>
      </div>
      <div class="col"></div>
    </template>

    <div class="col-3">
      Subscription ID
    </div>
    <div class="col-7">
      <q-input type="text" color="primary" filled v-model="subscription" label="" :disable="!emailVerified">
        <template v-slot:prepend>
          <q-icon name="o_shopping_bag"/>
        </template>
      </q-input>
    </div>
    <div class="col" v-if="subscription">
      <a href="https://billing.stripe.com/p/login/6oE00CenQc3R5IQdQQ" target="_blank">Portal</a>
    </div>
  </div>
</template>

<script lang="ts" setup>

import {ref, watchEffect, onMounted} from "vue";
import {LocalStorage, openURL} from "quasar";
import {EMAIL_LINK_REDIRECT_DOMAIN, SUBSCRIPTION_ID_IDENT} from "boot/constants";
import {FirebaseCall} from "src/services/firebase/FirebaseCall";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect,signInWithEmailLink,sendSignInLinkToEmail, signInWithCredential, UserCredential} from "firebase/auth";
import {setDoc, doc} from "firebase/firestore";
import {useAuthStore} from "../../stores/authStore";
import {NotificationType, useNotificationHandler} from "src/services/ErrorHandler";
import {useRouter} from "vue-router";
import PricingCard from "pages/helper/PricingCard.vue";
import PlanFeature from "pages/helper/PlanFeature.vue";
import FirebaseServices from "src/services/firebase/FirebaseServices";

const subscription = ref<string>(LocalStorage.getItem(SUBSCRIPTION_ID_IDENT) as string || '')

const userCredentials = ref<UserCredential | undefined>(undefined)
const claims = ref<object | undefined>(undefined)
const emailVerified = ref(false)

const { handleError } = useNotificationHandler()

const router = useRouter()

onMounted(() => {
  emailVerified.value = useAuthStore().user?.emailVerified || false
})

watchEffect(() => {
  (subscription.value && subscription.value.trim().length > 0) ?
    LocalStorage.set(SUBSCRIPTION_ID_IDENT, subscription.value) :
    LocalStorage.remove(SUBSCRIPTION_ID_IDENT)
})

const subscribe = async () => openURL('https://shared.tabsets.net/#/settings?tab=subscription')

const testSubscription = async () => {
  FirebaseCall.post("/stripe/test-subscription/tabsets", {})
    .then((res:any) => {
      console.log("res", res)
      window.location.href = res.data.url
    })
}

const authorizeWith = async (githubAuthProvider:any) => {
  const auth = FirebaseService.getAuth()
  console.log("auth", auth)
  //createUserWithEmailAndPassword(auth, "email", "password")
  //const credentials: UserCredential = await signInWithPopup(auth, githubAuthProvider)
  const credentials: UserCredential = await signInWithCredential(auth, githubAuthProvider)
  //const credentials: UserCredential = await signInWithRedirect(auth, githubAuthProvider)

  // const actionCodeSettings = {
  //   url: 'https://www.example.com/?email=user@example.com',
  //   iOS: {
  //     bundleId: 'com.example.ios'
  //   },
  //   android: {
  //     packageName: 'com.example.android',
  //     installApp: true,
  //     minimumVersion: '12'
  //   },
  //   handleCodeInApp: true
  // };
  // await sendSignInLinkToEmail(auth, 'evandor@gmail.com', actionCodeSettings);

  //const credentials: UserCredential = await signInWithEmailLink(auth, "evandor@gmail.com")
  console.log("userCredentials", credentials)
  console.log("userCredentials", {...credentials.user})
  userCredentials.value = credentials

  try {
    await setDoc(doc(FirebaseService.getFirestore(), "users", credentials.user.uid), {
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

const verifyEmail = () => {
  const auth = getAuth()
  const email = useAuthStore().user.email
  const actionCodeSettings = {
    url: EMAIL_LINK_REDIRECT_DOMAIN,
    handleCodeInApp: true,
  }
  console.log("sending verification link to", email, actionCodeSettings)
  sendSignInLinkToEmail(auth, email, actionCodeSettings)
    .then(() => {
      // loading.value = false
      // mailSent.value = true
      // setTimeout(() => {
      //     mailSent.value = false
      //     emits('hideLogin')
      //   }, 5000
      // )
     // window.localStorage.setItem(CURRENT_USER_EMAIL, email.value);
     // sendMsg('SET_EMAIL_FOR_SIGN_IN', {"email": email.value})
    })
    .catch((error) => {
      //console.error("error", error)
      handleError(error, NotificationType.TOAST)
      // loading.value = false
      // mailSent.value = false
    });

}

const openPaymentLink = () => openURL(process.env.STRIPE_SYNC_PRODUCT_LINK + '?prefilled_email=' + (useAuthStore().user?.email || ''))


</script>
