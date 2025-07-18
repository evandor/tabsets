<template>
  <q-btn :icon="icon" size="sm" outline @click="emits('button-clicked')" color="grey-7" class="cursor-pointer q-mt-xs">
    <q-tooltip class="tooltip-small" :delay="500">Open in Reading Mode</q-tooltip>
  </q-btn>
</template>
<script lang="ts" setup>
const props = defineProps<{ icon: string }>()
const emits = defineEmits(['button-clicked'])
</script>
