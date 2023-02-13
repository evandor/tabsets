<template>

  <div class="row q-ma-xl">
    <div class="col-2 q-ma-md" v-for="t in urlList" @click="NavigationService.openOrCreateTab(t.url)">
      <q-avatar class="cursor-pointer">
        <img :src="t.favIconUrl">
      </q-avatar>
      {{ t.title }}
    </div>
  </div>

</template>

<script setup lang="ts">

import {useQuasar} from "quasar";
import {Tab} from "src/models/Tab";
import {onMounted, ref} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import tabsetService from "src/services/TabsetService";
import NavigationService from "src/services/NavigationService";

const $q = useQuasar()
const localStorage = $q.localStorage
const tabs = ref<Tab[]>([])

const urlList = localStorage.getItem("ui.newTabUrlList")

// onMounted(() => {
//
//
//   IndexedDbPersistenceService.init()
//     .then(() => {
//       tabsetService.setLocalStorage(localStorage)
//       tabsetService.init(true)
//         .then(() => {
//           const tabsetId = localStorage.getItem("ui.tabsetIdForNewTab") as unknown as string
//           console.log("tabsetId", tabsetId)
//           const tabset = useTabsStore().getTabset(tabsetId)
//           if (tabset) {
//             console.log("tabset", tabset)
//             tabs.value = tabset.tabs
//           }
//         })
//     })
//
// })

</script>
