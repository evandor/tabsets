<template>
  <q-page padding style="padding-top: 210px">
  </q-page>

</template>

<script lang="ts" setup>
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";

const router = useRouter()

// no authentication in tabsets, only in "tabsets sync"
console.log("XXX", useQuasar().platform.is.bex )
if (useQuasar().platform.is.bex) {
  router.push("/sidepanel")
}

</script>
