<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
      <q-card class="q-dialog-plugin" style="max-width: 100%">
        <q-card-section>
          <div class="text-h6">Delete Folder</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body">
            Would you like to delete the folder: {{ props.folder.name }} (and existing subfolders)?
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <DialogButton label="Cancel" v-close-popup />
          <DialogButton
            label="Delete"
            :default-action="true"
            @keyup.enter="deleteFolder()"
            @wasClicked="deleteFolder()" />
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { DeleteTabsetFolderCommand } from 'src/tabsets/commands/DeleteTabsetFolderCommand'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useUiStore } from 'src/ui/stores/uiStore'
import { PropType } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  tabset: { type: Object as PropType<Tabset>, required: true },
  folder: { type: Object as PropType<Tabset>, required: true },
})

const { dialogRef, onDialogHide } = useDialogPluginComponent()

const deleteFolder = () =>
  useCommandExecutor()
    .executeFromUi(new DeleteTabsetFolderCommand(props.tabset, props.folder))
    .then((res: any) => {
      useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
      return res
    })
</script>
