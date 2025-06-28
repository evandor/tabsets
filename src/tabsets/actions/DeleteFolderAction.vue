<template>
  <q-separator inset />
  <ContextMenuItem
    v-close-popup
    @was-clicked="deleteTabsetDialog()"
    icon="o_delete"
    color="negative"
    label="Delete Folder">
  </ContextMenuItem>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import DeleteSubfolderDialog from 'src/tabsets/dialogues/DeleteSubfolderDialog.vue'

const $q = useQuasar()
const props = defineProps<ActionProps>()

const deleteTabsetDialog = () => {
  // if (props.tabset.tabs.length === 0) {
  //   useCommandExecutor().executeFromUi(new DeleteTabsetCommand(props.tabset.id))
  //   return
  // }
  $q.dialog({
    component: DeleteSubfolderDialog,
    componentProps: {
      tabset: props.tabset,
      folder: props.folder,
    },
  })
}
</script>
