<template>
  <template v-if="props.level === 'root'">
    <q-separator inset />
    <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="search" color="primary" label="Search" />
  </template>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { useUiStore } from 'src/ui/stores/uiStore'

const props = defineProps<ActionProps>()
const emits = defineEmits(['clicked'])
const clicked = () => {
  useUiStore().setQuickAccess('search', true)
  emits('clicked')
}
</script>
