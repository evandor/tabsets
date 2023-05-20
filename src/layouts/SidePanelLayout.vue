<template>
  <q-layout view="hHh lpR fFf">

    <q-page-container>
      <router-view/>
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white" v-if="tabsStore.tabsets.size > 0">
      <SidePanelFooter />
    </q-footer>

  </q-layout>

</template>

<script setup lang="ts">

import {ref, watchEffect} from "vue";
import SidePanelFooter from "components/SidePanelFooter.vue";
import {useTabsStore} from "stores/tabsStore";

const tabsStore = useTabsStore()

const location = ref('')

watchEffect(() => location.value = window.location.href.split('/www/')[1] || window.location.href)

</script>
