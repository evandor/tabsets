<template>
  <div class="q-ma-none q-pa-none bg-white">
    Annotation Mode {{ tabId }} - {{ tab?.url }} ({{ tab?.annotations.length }})
  </div>
</template>

<script lang="ts" setup>

import {useRoute} from "vue-router";
import {ref, watchEffect} from "vue";
import {useTabsetService} from "src/services/TabsetService2";
import TabsetService from "src/services/TabsetService";
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import {useQuasar} from "quasar";

const $q = useQuasar()
const route = useRoute()

const tabId = ref(route.params.tabId as string)
const tab = ref<Tab | undefined>(undefined)

watchEffect(async () => {
  console.log("checking tabId ", tabId.value)
  if (tabId.value) {
    const t = await useTabsStore().getTab(tabId.value)
    if (t) {
      console.log("ttt", t['tab' as keyof object])
      tab.value = t['tab' as keyof object]

      console.log("sending annotations...", tab.value['annotations'])
      $q.bex.send('tabsets.annotations', {
        annotations: tab.value['annotations']
      })
    }

  }
})


</script>
