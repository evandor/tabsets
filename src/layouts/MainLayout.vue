<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Quasar App
        </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Essential Bookmarks - {{ bookmrkx.length }}
        </q-item-label>

        <q-btn @click="saveTabset">Save</q-btn>
        <EssentialLink
          v-for="link in bookmrkx"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import EssentialLink, {EssentialLinkProps} from 'components/EssentialLink.vue';
import {initializeBackendApi} from "src/services/BackendApi";

const bookmrkx = ref<EssentialLinkProps[]>([])
chrome.tabs.query({currentWindow: true}, (ts: chrome.tabs.Tab[]) => {
  console.log("tabs", ts)
  ts.forEach(t =>
    bookmrkx.value.push(t))
});

console.log("meta.env.BASE_URL", import.meta.env.MODE);
console.log("meta.env.BASE_URL", process.env.BACKEND_URL);


function saveTabset() {
  console.log("saving tabset");
  const backend = initializeBackendApi(process.env.BACKEND_URL || "unknown", null)
  backend.saveTabset(bookmrkx.value)
}

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
