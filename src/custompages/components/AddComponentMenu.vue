<template>
  <q-icon name="add" color="primary" class="cursor-pointer" />
  <q-menu :key="props.blockId + '_' + props.position">
    <q-list dense style="min-width: 190px">
      <ContextMenuItem
        v-close-popup
        @was-clicked="emits('add-component', { type: 'text', blockId: blockId, position: position })"
        icon="o_settings"
        label="Add Text" />
    </q-list>
  </q-menu>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'

const props = defineProps<{
  blockId: string
  position: string
}>()
const emits = defineEmits(['add-component'])
</script>
