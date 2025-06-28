<template>
  <template v-if="props.level === 'root'">
    <q-separator inset />
    <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_inventory_2" color="warning" label="Archive">
    </ContextMenuItem>
  </template>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { NotificationType } from 'src/core/services/ErrorHandler'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { MarkTabsetAsArchivedCommand } from 'src/tabsets/commands/MarkTabsetAsArchived'

const props = defineProps<ActionProps>()

const clicked = () => {
  useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(props.tabset.id), NotificationType.NOTIFY)
}
</script>
