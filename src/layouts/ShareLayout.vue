<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container style="max-width: 1200px; margin: 0 auto">
      <!-- https://stackoverflow.com/questions/71703650/vuejs-view-is-not-refreshing-when-i-change-the-router-paramid-->
      <router-view :key="$route.path" />
    </q-page-container>
    <q-footer class="bg-white">
      <div class="row q-ma-sm q-mb-lg">
        <div class="col-12 text-center text-primary">
          powered by
          <span class="text-blue-8 cursor-pointer" @click="clicked('https://docs.tabsets.net')">Tabsets Pro</span>
        </div>
        <br />
        <div class="col-12 text-center text-primary">
          <span
            class="text-grey q-mx-none cursor-pointer"
            style="font-size: smaller"
            @click.stop="clicked('https://tabsets.web.app/#/privacy')"
            >Privacy</span
          >
          <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
          <span
            class="text-grey q-mx-none cursor-pointer"
            style="font-size: smaller"
            @click.stop="clicked('https://tabsets.web.app/#/tos')"
            >Terms of Service</span
          >
          <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
          <span
            class="text-grey q-mx-none cursor-pointer"
            style="font-size: smaller"
            @click.stop="clicked('https://docs.tabsets.net')"
            >Documentation</span
          >
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>
<script setup lang="ts">
import { openURL } from 'quasar'

const clicked = (url: string) => openURL(url, undefined, { target: '_blank' })
</script>
