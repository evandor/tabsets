<template>

  <component :is="isMobile ? WelcomePageMobile : WelcomePageDesktop" />

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'


import WelcomePageDesktop from './WelcomePageDesktop.vue'
import WelcomePageMobile from './WelcomePageMobile.vue'

const $q = useQuasar()
const isMobile = computed(() => $q.screen.lt.md)
</script>
