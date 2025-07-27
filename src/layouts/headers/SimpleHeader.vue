<template>
  <q-header class="bg-white text-primary" elevated>
    <q-toolbar class="justify-between">
      <div class="row items-center">
        <q-avatar icon="restaurant_menu" color="primary" text-color="white" />
        <q-toolbar-title class="q-ml-sm">Bibbly</q-toolbar-title>
      </div>
      <div class="row items-center q-gutter-sm q-pr-sm">
        <q-btn flat label="Login" color="primary" @click="goToLogin" />
        <q-btn flat label="Sign Up" color="secondary" @click="goToRegister" />
      </div>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

async function goToLogin() {
  await router.push('/p/login');
}
async function goToRegister() {
  await router.push('/p/register');
}
</script>
