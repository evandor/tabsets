<template>
  <info-message-widget v-if="exceededInfo" ident="0">
    {{ exceededMessage() }}
  </info-message-widget>

  <div>
    {{ account }}
  </div>

  <div>
    {{ activeSubscriptions }}
  </div>

  <div class="q-pa-md q-mt-xl row items-start justify-center q-gutter-md">
    <PricingCard :active="roles.length === 0">
      <template v-slot:overline>Support Tabsets</template>
      <template v-slot:title>Free</template>
      <template v-slot:price>0 &euro; <span class="text-body1">/month</span></template>
      <template v-slot:teaser> Limited number of tabsets and links.</template>
      <template v-slot:features>
        <PlanFeature
          :features="[
            //'share tabsets publicly',
            'max. ' + TABS_LIMIT_NO_SUBSCRIPTION + ' Tabs',
            'max. ' + TABSETS_LIMIT_NO_SUBSCRIPTION + ' Tabsets',
            'max. ' + SPACES_LIMIT_NO_SUBSCRIPTION + ' Spaces',
            'max. ' + THUMBNAILS_LIMIT_NO_SUBSCRIPTION + ' MBytes of Thumbnails',
            // 'optional newsletter',
            // 'feature request form',
            //'access to experimental features',
          ]" />
      </template>
      <template v-slot:actions>
        <q-btn
          v-if="!useAuthStore().isAuthenticated"
          color="primary"
          class="cursor-pointer"
          style="width: 200px"
          @click="router.push('/login')">
          Sign up for free
        </q-btn>
        <q-btn v-else color="grey-5" disable style="width: 200px"> Already got it</q-btn>
      </template>
    </PricingCard>

    <PricingCard v-for="p in plans" :active="checkPlan(p)">
      <template v-slot:overline>Getting more serious</template>
      <template v-slot:title>{{ p['name'] }}</template>
      <template v-slot:price>{{ priceFor(p) }} &euro; <span class="text-body1">/month</span></template>
      <template v-slot:teaser> Synchronize your Tabsets data across browsers and computers.</template>
      <template v-slot:features>
        <PlanFeature
          :features="
            ['synchronized tabsets', 'share tabsets publicly', 'access to experimental features'].concat(
              featureLimitsFor(p),
            )
          " />
      </template>
      <template v-slot:actions>
        <template v-if="checkPlan(p)">
          <q-btn color="primary" @click="openStripeCustomerPortal()">Manage Subscription</q-btn>
          <div>{{ checkCancelled(p) }}</div>
        </template>
        <template v-else>
          <q-btn color="primary" class="cursor-pointer" style="width: 200px" @click="openPaymentLink()">
            Choose Tabsets User
          </q-btn>
        </template>
      </template>
    </PricingCard>
  </div>

  <div class="row items-baseline q-ma-md q-gutter-lg">
    <div class="col-3">Logged in as</div>
    <div class="col-7">
      {{ useAuthStore().user?.email || '---' }}
    </div>
    <div class="col"></div>

    <template v-if="!emailVerified && useAuthStore().isAuthenticated">
      <div class="col-3">Please verify your email first</div>
      <div class="col-7">
        <q-btn label="Verify" @click="verifyEmail()" />
      </div>
      <div class="col"></div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {
  SPACES_LIMIT_NO_SUBSCRIPTION,
  TABS_LIMIT_NO_SUBSCRIPTION,
  TABSETS_LIMIT_NO_SUBSCRIPTION,
  THUMBNAILS_LIMIT_NO_SUBSCRIPTION,
} from 'boot/constants'
import InfoMessageWidget from 'components/widgets/InfoMessageWidget.vue'
import { getAuth, sendEmailVerification } from 'firebase/auth/web-extension'
import { addDoc, collection, DocumentData, getDocs, onSnapshot, query, QuerySnapshot, where } from 'firebase/firestore'
import PlanFeature from 'pages/helper/PlanFeature.vue'
import PricingCard from 'pages/helper/PricingCard.vue'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Account } from 'src/core/models/Account'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useAuthStore } from 'stores/authStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFirebaseServices } from 'src/services/firebase/useFirebaseServices'

const emailVerified = ref(false)
const plans = ref<any[]>([])
const account = ref<Account | undefined>(undefined)
const roles = ref<string[]>([])
const exceededInfo = ref<{ exceeded: string; limit: number | undefined } | undefined>(undefined)
const activeSubscriptions = ref<object[]>([])

const { handleSuccess, handleError } = useNotificationHandler()

const router = useRouter()
const route = useRoute()

onMounted(async () => {
  emailVerified.value = useAuthStore().user?.emailVerified || false
  // await getSubscriptions()
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  account.value = useAuthStore().getAccount()
  roles.value = useAuthStore().getRoles()

  console.log('------>')
  plans.value = []
  const productSnapshots: QuerySnapshot<DocumentData, DocumentData> = await getDocs(
    query(collection(useFirebaseServices().firebaseServices.getFirestore(), 'products'), where('active', '==', true)),
  )
  for (const doc of productSnapshots.docs) {
    console.log('***', doc.id, ' => ', doc.data())
    const p: { [k: string]: any } = { name: doc.data().name, id: doc.id, metadata: doc.data().metadata }
    const r: any = await getDocs(
      query(collection(useFirebaseServices().firebaseServices.getFirestore(), 'products', doc.id, 'prices'), where('active', '==', true)),
    )
    const prices: object[] = []
    r.forEach((d: any) => {
      console.log('price', d.id, d.data())
      prices.push({ priceId: d.id, price: d.data().unit_amount })
    })
    p.prices = prices

    plans.value.push(p)
  }

  if (route.query['exceeded'] && route.query['limit']) {
    exceededInfo.value = {
      exceeded: route.query['exceeded'] as string,
      limit: route.query['limit'] ? Number(route.query['limit']) : undefined,
    }
  }
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  activeSubscriptions.value = []
  const t = await getDocs(
    query(
      collection(useFirebaseServices().firebaseServices.getFirestore(), 'users', useAuthStore().user.uid, 'subscriptions'),
      where('status', '==', 'active'),
    ),
  )
  for (const doc of t.docs) {
    activeSubscriptions.value.push({
      cancel_at_period_end: doc.data()['cancel_at_period_end' as keyof object],
      cancel_at: doc.data()['cancel_at' as keyof object],
      // product: doc.data()['product' as keyof object],
      role: doc.data()['role' as keyof object],
    })
  }
})

const verifyEmail = () => {
  const email = useAuthStore().user.email
  const actionCodeSettings = {
    url: 'https://tabsets.me',
    handleCodeInApp: true,
  }
  console.log('sending verification link to', email, actionCodeSettings)
  const auth = getAuth()
  sendEmailVerification(auth.currentUser!)
    .then(() => {
      handleSuccess(new ExecutionResult('', 'Email has been sent'), NotificationType.NOTIFY)
    })
    .catch((err: any) => handleError(err))
}

const openPaymentLink = async () => {
  //openURL(process.env.STRIPE_SYNC_PRODUCT_LINK + '?prefilled_email=' + (useAuthStore().user?.email || ''))

  const sessionRef = await addDoc(
    collection(useFirebaseServices().firebaseServices.getFirestore(), 'users', useAuthStore().user.uid, 'checkout_sessions'),
    {
      price: plans.value[0].prices[0].priceId, //'price_1PfKwdCRr6mfm8sfCLKbBtDu',
      success_url: 'https://Tabsets.me/', //window.location.origin,
      cancel_url: 'https://Tabsets.me/', //window.location.origin
    },
  )

  // Wait for the CheckoutSession to get attached by the extension
  onSnapshot(sessionRef, (snap: any) => {
    const { error, url } = snap.data()
    if (error) {
      // Show an error to your customer and
      // inspect your Cloud Function logs in the Firebase console.
      alert(`An error occured: ${error.message}`)
    }
    if (url) {
      // We have a Stripe Checkout URL, let's redirect.
      window.location.assign(url)
    }
  })
  //sessionRef.onSnapshot((snap:any) => {

  //});
}

const featureLimitsFor = (plan: object) => {
  const limits: string[] = []
  limits.push('max. ' + (plan['metadata' as keyof object]['tabsLimit'] as string) + ' Tabs')
  limits.push('max. ' + (plan['metadata' as keyof object]['tabsetsLimit'] as string) + ' Tabsets')
  limits.push('max. ' + (plan['metadata' as keyof object]['spacesLimit'] as string) + ' Spaces')
  return limits
}

const priceFor = (plan: object) => {
  return (plan['prices' as keyof object][0]['price'] / 100).toLocaleString()
}

const checkPlan = (plan: object) => {
  //console.log('plan', plan)
  const plansRole: string = plan['metadata' as keyof object]['firebaseRole' as keyof object] || '???'
  return roles.value.indexOf(plansRole) >= 0
}

const checkCancelled = (plan: object) => {
  console.log('plan', plan)
  const plansRole: string = plan['metadata' as keyof object]['firebaseRole' as keyof object] || '???'
  const cancelled = activeSubscriptions.value.find(
    (s: object) => s['role' as keyof object] === plansRole && s['cancel_at_period_end' as keyof object],
  )
  console.log('cancelled', cancelled)
  if (cancelled) {
    return 'cancelled'
  }
  return ''
}

const exceededMessage = () => {
  return (
    'You have exceeded a limit for your account type. With your current subscription you are only allowed ' +
    exceededInfo.value?.limit +
    ' ' +
    exceededInfo.value?.exceeded +
    '. Consider removing some of your data or upgrade your subscription:'
  )
}

const openStripeCustomerPortal = () => {
  useNavigationService().browserTabFor(process.env.STRIPE_CUSTOMER_PORTAL!)
}
</script>
