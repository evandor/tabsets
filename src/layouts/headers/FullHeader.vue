<template>
  <q-header elevated style="background-color: #087F8C; color: white;">
    <q-toolbar class="q-gutter-sm justify-between">
      <div class="row items-center">
        <q-btn v-if="showBackButton" flat dense icon="arrow_back" @click="goBack"
          :label="$q.screen.gt.sm ? 'Zurück' : undefined" :round="$q.screen.lt.sm" />
      </div>

      <q-toolbar-title class="text-center app-title">
        bibbly <span class="subtitle">recipes</span>
      </q-toolbar-title>

      <q-btn flat round dense icon="menu" @click="rightDrawerOpen = !rightDrawerOpen" />
    </q-toolbar>
  </q-header>

  <!-- Right Drawer -->
  <q-drawer side="right" v-model="rightDrawerOpen" overlay bordered behavior="desktop">
    <q-list>
      <q-item clickable v-ripple @click="onImport">
        <q-item-section avatar><q-icon name="file_upload" /></q-item-section>
        <q-item-section>Importieren</q-item-section>
      </q-item>

      <q-item clickable v-ripple @click="onShare">
        <q-item-section avatar><q-icon name="share" /></q-item-section>
        <q-item-section>Teilen</q-item-section>
      </q-item>

      <q-item clickable v-ripple @click="onAgb">
        <q-item-section avatar><q-icon name="gavel" /></q-item-section>
        <q-item-section>AGB</q-item-section>
      </q-item>

      <q-item clickable v-ripple @click="onImpressum">
        <q-item-section avatar><q-icon name="info" /></q-item-section>
        <q-item-section>Impressum</q-item-section>
      </q-item>

      <q-separator spaced />

      <q-item clickable v-ripple @click="onLogout">
        <q-item-section avatar><q-icon name="logout" /></q-item-section>
        <q-item-section>Abmelden</q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const rightDrawerOpen = ref(false);
const route = useRoute();
const router = useRouter();

const showBackButton = computed(() =>
  ['recipe-detail'].includes(route.name as string)
);

async function goBack() {
  await router.push('/home');
}

function onImport() {
  console.log('Importieren');
}
function onShare() {
  console.log('Teilen');
}
function onAgb() {
  console.log('AGB');
}
function onImpressum() {
  console.log('Impressum');
}
function onLogout() {
  console.log('Logout');
}
</script>
