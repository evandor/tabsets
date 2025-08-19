<template>

  <component :is="isMobile ? DashboardPageMobile : DashboardPageDesktop" />

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'


import DashboardPageMobile from './DashboardPageMobile.vue'
import DashboardPageDesktop from './DashboardPageDesktop.vue'

const $q = useQuasar()
const isMobile = computed(() => $q.screen.lt.md)
</script>
