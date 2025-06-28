<template>
  <q-btn
    padding="xs"
    fab-mini
    unelevated
    class="q-ma-none q-px-sm q-py-none"
    :icon="props.icon"
    :color="props.color"
    size="12px"
    @click="emits('button-clicked')">
  </q-btn>
</template>
<script lang="ts" setup>
const emits = defineEmits(['button-clicked'])
const props = defineProps<{
  icon: string
  color: string
}>()
</script>
