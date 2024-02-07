<template>
  <q-layout view="hHh lpR fFf">

    <q-page-container>
      <router-view/>
    </q-page-container>

    <q-footer elevated v-if="tabsStore.tabsets?.size > 0">
      <SidePanelFooter/>
    </q-footer>
    <q-footer elevated v-else>
      <SidePanelFooter/>
    </q-footer>

  </q-layout>

</template>

<script setup lang="ts">

import {ref, watchEffect} from "vue";
import SidePanelFooter from "components/SidePanelFooter.vue";
import {useTabsStore} from "src/stores/tabsStore";
import {useMeta, useQuasar} from "quasar";
import SidePanelWelcomeFooter from "components/SidePanelWelcomeFooter.vue";

const tabsStore = useTabsStore()

const location = ref('')


useMeta(() => {
  //console.debug("using meta...")
  return {
    // @ts-ignore
    title: 'Tabsets Extension...' //+ appVersion
  }
})


watchEffect(() => location.value = window.location.href.split('/www/')[1] || window.location.href)


</script>
