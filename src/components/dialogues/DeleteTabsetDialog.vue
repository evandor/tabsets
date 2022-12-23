<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Deleting Tabset</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Would you like to delete the tabset {{ props.tabsetName }}?</div>
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="Delete Tabset"
               v-close-popup
               @click="deleteTabset()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {useDialogPluginComponent} from 'quasar'
import {useCommandExecutor} from "src/services/CommandExecutor";
import {MarkTabsetDeletedCommand} from "src/domain/commands/MarkTabsetDeletedCommand";
import {inject} from "vue";

defineEmits([
  ...useDialogPluginComponent.emits
])

const logger = inject('vuejs3-logger')

const props = defineProps({
  tabsetId: {
    type: String,
    required: true
  },
  tabsetName: {
    type: String,
    required: true
  }
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()
const deleteTabset = () => useCommandExecutor(logger).executeFromUi(new MarkTabsetDeletedCommand(props.tabsetId))


</script>
