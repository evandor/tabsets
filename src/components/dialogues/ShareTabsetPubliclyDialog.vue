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
      <q-card-section>
        <div class="text-body">Author:</div>
        <q-input v-model="author"
                 class="q-mb-md q-pb-none"
                 dense autofocus
                 type="text"
                 error-message="Please do not use special Characters, maximum length is 32"/>
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn size="md" color="accent" label="Cancel" @click="onDialogCancel"/>
        <q-btn size="md" color="warning" :label="props.republish ? 'Republish Tabset':'Share Tabset'"
               v-close-popup
               :disable="!author"
               @click="shareTabset()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {useDialogPluginComponent, useQuasar} from 'quasar'
import {useCommandExecutor} from "src/services/CommandExecutor";
import {ShareTabsetCommand} from "src/domain/tabsets/ShareTabset";
import {TabsetSharing} from "src/models/Tabset";
import {ref} from "vue";

defineEmits([
  ...useDialogPluginComponent.emits
])

const $q = useQuasar()

const props = defineProps({
  tabsetId: {type: String, required: true},
  tabsetName: {type: String, required: true},
  sharedId: {type: String, required: false},
  republish: {type: Boolean, required: false}
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const author = ref<string>($q.localStorage.getItem('sharing.author') || '')

const shareTabset = () => {
  $q.localStorage.set('sharing.author', author.value)
  useCommandExecutor()
    .executeFromUi(new ShareTabsetCommand(props.tabsetId, props.sharedId, TabsetSharing.PUBLIC, author.value, props.republish))
    .then((res: any) => {
      //useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)
    })
}


</script>
