<template>

  <q-page style="padding-top: 50px">
    <div class="row q-ma-none q-pa-none q-mt-xl justify-center items-center">
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
          <q-btn color="primary" class="cursor-pointer" style="width:200px"
                 :loading="loading"
                 @click="checkoutSession()">
            Choose SYNC
          </q-btn>
        </template>
      </PricingCard>
    </div>

    <q-page-sticky expand position="top" style="background-color:white">

      <FirstToolbarHelper
        :showSearchBox="false">
      </FirstToolbarHelper>
    </q-page-sticky>
  </q-page>

</template>

<script lang="ts" setup>

import PricingCard from "pages/helper/PricingCard.vue";
import PlanFeature from "pages/helper/PlanFeature.vue"
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {useAuthStore} from "stores/authStore";
import {createCheckoutSession} from "src/services/stripe/createCheckoutSession";
import {LocalStorage} from "quasar";
import {ref} from "vue";
import NavigationService from "src/services/NavigationService";
import {CURRENT_USER_ID} from "boot/constants";

const loading = ref(false)

const checkoutSession = async () => {
  const userIdFromAuth = useAuthStore().user?.uid
  const userId = userIdFromAuth ? userIdFromAuth : LocalStorage.getItem(CURRENT_USER_ID) as string
  if (userId) {
    try {
      loading.value = true
      console.log("creating checkout session with", userId)
      //await createCheckoutSession(userId)
      await NavigationService.openSingleTab("https://tabsets.web.app/#/pricing")
    } finally {
      loading.value = false
    }
  } else {
    alert("no user found")
  }
}

</script>
