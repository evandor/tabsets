<!-- src/components/AppPageWrapper.vue -->
<template>
  <div class="q-px-md q-px-xl-md" :style="{ maxWidth: maxWidth, margin: '0 auto' }">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  maxWidth?: string
}>()
</script>
