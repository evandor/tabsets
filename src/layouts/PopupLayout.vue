<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container style="min-width: 450px; max-width: 450px">
      <!-- https://stackoverflow.com/questions/71703650/vuejs-view-is-not-refreshing-when-i-change-the-router-paramid-->
      <!-- https://router.vuejs.org/guide/advanced/transitions.html -->
      <router-view :key="$route.path" />
      <!--      <router-view :key="$route.path" v-slot="{ Component }">-->
      <!--        <transition name="slide-fade">-->
      <!--          <component :is="Component" />-->
      <!--        </transition>-->
      <!--      </router-view>-->
    </q-page-container>

    <q-footer elevated>
      <PopupFooter />
    </q-footer>
  </q-layout>
</template>
<script setup lang="ts">
import PopupFooter from 'src/core/components/PopupFooter.vue'
</script>

<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
