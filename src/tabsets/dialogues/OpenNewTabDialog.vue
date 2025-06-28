<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
      <q-card class="q-dialog-plugin" style="max-width: 100%">
        <q-card-section>
          <div class="text-h6">{{ props.tabset.newTabSource ? 'Update NewTab Page' : 'Use in NewTab Page' }}</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body" v-if="props.tabset?.newTabSource">
            If your tabs have changed, you can update the URLs for the NewTab Page by clicking on 'update'
          </div>
          <div class="text-body" v-else>
            Click on 'Add' to use this tabset as URL selection whenever you open a new tab in your browser.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <DialogButton label="Cancel" color="accent" @wasClicked="onDialogCancel()" />
          <DialogButton
            :label="props.tabset?.newTabSource ? 'Update' : 'Add'"
            type="submit"
            :default-action="true"
            @was-clicked="onDialogOK()" />
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { Tabset } from 'src/tabsets/models/Tabset'
import { PropType } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  tabset: { type: Object as PropType<Tabset>, required: true },
})

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>
