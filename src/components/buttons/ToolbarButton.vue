<template>
  <q-btn
      :icon="props.icon"
      flat
      class="q-ma-none q-pa-xs cursor-pointer"
      style="max-width:20px"
      size="13px">
    <q-tooltip class="tooltip" v-if="props.tooltip">{{props.tooltip}}</q-tooltip>
  </q-btn>
</template>
<script setup lang="ts">

const props = defineProps({
  icon: {type: String, required: true},
  tooltip: {type: String, required: false}
})
</script>