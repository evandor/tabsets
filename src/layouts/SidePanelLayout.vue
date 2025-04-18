<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated>
      <SidePanelFooter />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useMeta } from 'quasar'
import SidePanelFooter from 'src/core/components/SidePanelFooter.vue'
import { ref, watchEffect } from 'vue'

const location = ref('')

useMeta(() => {
  //console.debug("using meta...")
  return {
    title: 'Tabsets Extension...', //+ appVersion
  }
})

watchEffect(() => (location.value = window.location.href.split('/www/')[1] || window.location.href))
</script>
