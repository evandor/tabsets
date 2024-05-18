<template>


</template>

<script setup lang="ts">

import {useRouter} from "vue-router";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

const router = useRouter()

router.push("/tabsets/" + useTabsetsStore().currentTabsetId)

// watchEffect(() => {
//   const highlight = route.query['highlight'] as unknown as string
//   if (highlight && highlight.length > 0) {
//     try {
//       highlightUrl.value = atob(highlight)
//     } catch (e: any) {
//       console.error("highlight error", e)
//     }
//   }
// })



</script>
