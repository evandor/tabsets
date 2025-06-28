<template>
  <div v-for="tab in props.tabs" class="text-body1">{{ tab.url }}</div>
</template>

<script setup lang="ts">
import { Tab } from 'src/tabsets/models/Tab'
import { PropType } from 'vue'

const props = defineProps({
  tabs: { type: Array as PropType<Tab[]>, required: true },
})
</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
