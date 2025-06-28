<template>
  <template v-if="props.level === 'root'">
    <q-separator inset />
    <ContextMenuItem
      v-close-popup
      @was-clicked="deleteTabsetDialog()"
      icon="o_delete"
      color="negative"
      :disable="props.tabset.sharing?.sharedId !== undefined"
      :label="props.tabset.type === TabsetType.SESSION ? 'Delete Session' : 'Delete Tabset'">
      <q-tooltip class="tooltip-small" v-if="props.tabset.sharing?.sharedId !== undefined">
        Stop sharing first if you want to delete this tabset
      </q-tooltip>
    </ContextMenuItem>
  </template>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { DeleteTabsetCommand } from 'src/tabsets/commands/DeleteTabsetCommand'
import DeleteTabsetDialog from 'src/tabsets/dialogues/DeleteTabsetDialog.vue'
import { TabsetType } from 'src/tabsets/models/Tabset'

const $q = useQuasar()
const props = defineProps<ActionProps>()

const deleteTabsetDialog = () => {
  if (props.tabset.tabs.length === 0) {
    useCommandExecutor().executeFromUi(new DeleteTabsetCommand(props.tabset.id))
    return
  }
  $q.dialog({
    component: DeleteTabsetDialog,
    componentProps: {
      tabsetId: props.tabset.id,
      tabsetName: props.tabset.name,
      tabsCount: props.tabset.tabs.length,
    },
  })
}
</script>
