<template>
  <q-page padding>

    <div class="text-h5 q-ma-md">
      Welcome to Tabsets
    </div>

    <div class="text-body1 q-ma-md" v-if="tabsStore.tabsets.size === 0">
      Tabsets is a browser extension which helps you organize your tabs.<br><br>
      A <span class="text-body1 text-dark">tabset</span> is just a collection of tabs you can give a name to.
    </div>
    <div class="text-body1 q-ma-md" v-else>
      Tabsets is a browser extension which helps you organize your tabs.<br><br>
      You are managing <b>{{ tabsStore.allTabsCount }} tabs</b> in <b>{{ tabsStore.tabsets.size }} Tabsets</b> already.
    </div>

    <div class="text-h5 q-ma-md">
      Basic Features
    </div>

    <div class="text-body1 q-ma-md">
      <ul>
        <li>Turn your open tabs into a <span class="text-body1 text-dark">tabset</span></li>
        <li>Re-open your <span class="text-body1 text-dark">tabsets</span> whenever you need them</li>
        <li>Edit <span class="text-body1 text-dark">tabsets</span></li>
        <li>Search for keywords in your <span class="text-body1 text-dark">tabsets</span></li>
        <li>Drag & drop tabs into tabsets</li>
      </ul>
    </div>

    <div v-if="tabsStore.tabsets.size === 0">

      <div class="text-h5 q-ma-md">
        Get started
      </div>

      <div class="text-body1 q-ma-md">
        Click on the plus sign <q-icon name="add_circle_outline" size="24px" color="accent" class="cursor-pointer" @click="animateFab()"></q-icon> on the lower right page.
      </div>
    </div>

    <fab></fab>
  </q-page>

</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import Fab from "src/components/Fab.vue"
import {useNotificationsStore} from "stores/notificationsStore";

const tabsStore = useTabsStore()

const animateFab = () => useNotificationsStore().animateFab()

</script>
