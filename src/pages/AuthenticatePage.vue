<template>
  <q-page padding style="padding-top: 210px">
  </q-page>

</template>

<script lang="ts" setup>
import {useRouter} from "vue-router";

const router = useRouter()

// no authentication in tabsets, only in "tabsets sync"
router.push("/sidepanel")

</script>
