<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
        <q-card class="q-dialog-plugin" style="max-width:100%">
          <q-card-section>
            <div class="text-h6">Delete Tabset</div>
          </q-card-section>
          <q-card-section>
            <div class="text-body">Would you like to delete the tabset: {{ props.tabsetName }}?</div>
          </q-card-section>
          <q-card-actions align="right">

            <DialogButton label="Cancel" color="accent" v-close-popup/>
            <DialogButton label="Delete"
                          type="submit"
                          :disable="!isValid"
                          :autofocus="true"
                          @keyup.enter="deleteTabset()"
                          @wasClicked="deleteTabset()"
                          v-close-popup/>

          </q-card-actions>
        </q-card>
    </div>
  </q-dialog>

</template>

<script lang="ts" setup>

import {QForm, useDialogPluginComponent} from 'quasar'
import {useCommandExecutor} from "src/services/CommandExecutor";
import {MarkTabsetDeletedCommand} from "src/tabsets/commands/MarkTabsetDeleted";
import {SidePanelView, useUiStore} from "stores/uiStore";
import DialogButton from "components/buttons/DialogButton.vue";
import {ref} from "vue";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  tabsetId: {type: String, required: true},
  tabsetName: {type: String, required: true},
  sidePanelMode: {type: Boolean, default: true}
})

const {dialogRef, onDialogHide} = useDialogPluginComponent()

const theForm = ref<QForm>(null as unknown as QForm)
const isValid = ref(true)

const deleteTabset = () => useCommandExecutor().executeFromUi(new MarkTabsetDeletedCommand(props.tabsetId))
    .then((res: any) => {
      if (props.sidePanelMode) {
        useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)
      }
      return res
    })


</script>
