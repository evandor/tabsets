<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <NewTabsetDialogBody
      :space-id="props.spaceId!"
      :name="props.name"
      :window-id="props.windowId!"
      :from-panel="props.fromPanel" />
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import NewTabsetDialogBody from 'src/tabsets/dialogues/helper/NewTabsetDialogBody.vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  spaceId: { type: String, required: false },
  name: { type: String, default: '' },
  windowId: { type: Number, required: false },
  fromPanel: { type: Boolean, default: false },
})

const { dialogRef, onDialogHide } = useDialogPluginComponent()
</script>
