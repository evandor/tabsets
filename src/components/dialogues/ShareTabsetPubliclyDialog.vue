<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div v-if="props.republish" class="text-h6">Republish Tabset</div>
        <div v-else class="text-h6">Share Tabset Publicly</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Would you like to {{ props.republish ? 're-share' : 'share' }} this tabset:
          {{ props.tabsetName }}?
        </div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Anyone with the link to this shared tabset will be able to see its tabs.</div>
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat :label="props.republish ? 'Republish Tabset':'Share Tabset'"
               v-close-popup
               @click="shareTabset()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {useDialogPluginComponent} from 'quasar'
import {useCommandExecutor} from "src/services/CommandExecutor";
import {MarkTabsetDeletedCommand} from "src/domain/tabsets/MarkTabsetDeleted";
import {SidePanelView, useUiStore} from "stores/uiStore";
import {ShareTabsetCommand} from "src/domain/tabsets/ShareTabset";
import {TabsetSharing} from "src/models/Tabset";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  tabsetId: {type: String, required: true},
  tabsetName: {type: String, required: true},
  sharedId: {type: String, required: false},
  republish: {type: Boolean, required: false}
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()
const shareTabset = () => useCommandExecutor()
  .executeFromUi(new ShareTabsetCommand(props.tabsetId, props.sharedId, TabsetSharing.PUBLIC, props.republish))
  .then((res: any) => {
    //useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)
  })


</script>
