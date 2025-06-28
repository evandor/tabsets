<template>
  <q-page padding style="padding-top: 210px"> </q-page>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const redirect = useRoute().params.redirect as string

// no authentication in tabsets, only in "tabsets sync"
if (useQuasar().platform.is.bex) {
  console.log('refreshing page, redirecting to', redirect)
  router.push('/' + redirect)
} else {
  router.push('/sidepanel/tabsets')
}
</script>
