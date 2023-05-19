<template>
  <q-layout view="hHh lpR fFf">

    <q-page-container>
      <router-view/>
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white">
      <SidePanelFooter />
    </q-footer>

  </q-layout>

</template>

<script setup lang="ts">

import {ref, watchEffect} from "vue";
import SidePanelFooter from "components/SidePanelFooter.vue";

const location = ref('')

watchEffect(() => location.value = window.location.href.split('/www/')[1] || window.location.href)

</script>
