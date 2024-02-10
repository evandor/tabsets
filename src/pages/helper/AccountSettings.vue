<template>

  <div class="q-pa-md q-gutter-sm">
    <q-banner rounded style="border:1px solid orange">
      If you are currently logged in, your account details will be shown here.
    </q-banner>

    <div class="row items-baseline q-ma-md q-gutter-lg">

      <template v-if="account">
        <div class="col-12 text-bold">
          Account
        </div>

        <InfoLine label="Email">{{ user?.email }}</InfoLine>
        <InfoLine label="created at">{{ date.formatDate(user?.metadata.creationTime, 'DD.MM.YYYY HH:mm') }}</InfoLine>
        <InfoLine label="lastLoginAt">{{ date.formatDate(user?.metadata.lastSignInTime, 'DD.MM.YYYY HH:mm') }}</InfoLine>
        <InfoLine label="provider">{{ user?.providerData[0]?.providerId }}</InfoLine>
        <InfoLine label="Subscriptions">{{ account.products }}</InfoLine>

      </template>

    </div>
  </div>

</template>

<script lang="ts" setup>

import {Account} from "src/models/Account";
import {onMounted, ref} from "vue";
import {useAuthStore} from "stores/authStore";
import {date, LocalStorage} from "quasar";
import {CURRENT_USER_EMAIL} from "boot/constants";
import {getAuth, User} from "firebase/auth";
import InfoLine from "pages/helper/InfoLine.vue";

const account = ref<Account | undefined>(undefined)
const email = ref<string | undefined>(undefined)
const products = ref<Set<string>>(new Set())
const user = ref<User | null>(null)

onMounted(() => {
  account.value = useAuthStore().getAccount()
  email.value = LocalStorage.getItem(CURRENT_USER_EMAIL) as string
  user.value = getAuth().currentUser

  products.value = new Set()
  if (account.value) {
    const subscriptions = account.value.subscriptions
    console.log("account", account.value)
    if (subscriptions) {
      for (const s of subscriptions) {
        console.log("s", s)
        if (s.status === "active") {
          const items = s.items
          for (const i of items) {
            console.log("checking item", i)
            if (i.plan.product) {
              products.value.add(i.plan.product)
            }
          }
        }
      }
    }
  }
})

</script>
