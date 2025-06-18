<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container style="min-width: 450px; max-width: 450px">
      <!-- https://stackoverflow.com/questions/71703650/vuejs-view-is-not-refreshing-when-i-change-the-router-paramid-->
      <router-view :key="$route.path" />
    </q-page-container>

    <q-footer elevated>
      <PopupFooter />
    </q-footer>
  </q-layout>
</template>
<script setup lang="ts">
import PopupFooter from 'src/core/components/PopupFooter.vue'
</script>
