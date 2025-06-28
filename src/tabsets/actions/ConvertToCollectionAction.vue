<template>
  <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_folder" color="warning" label="Convert to Collection">
    <q-tooltip class="tooltip-small"> Convert this temporary session to a proper tabset collection </q-tooltip>
  </ContextMenuItem>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const props = defineProps<ActionProps>()

const clicked = () => {
  props.tabset.type = TabsetType.DEFAULT
  useTabsetsStore().saveTabset(props.tabset)
}
</script>
