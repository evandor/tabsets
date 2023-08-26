<template>
    <q-dialog ref="dialogRef" @hide="onDialogHide">
      <NewWindowDialogBody :space-id="props.spaceId" :from-panel="props.fromPanel"/>
    </q-dialog>
</template>

<script lang="ts" setup>

import {useDialogPluginComponent} from "quasar";
import NewTabsetDialogBody from "components/dialogues/helper/NewTabsetDialogBody.vue";
import NewWindowDialogBody from "components/dialogues/helper/NewWindowDialogBody.vue";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  spaceId: {type: String, required: false},
  fromPanel: {type: Boolean, default: false}
})

const {dialogRef, onDialogHide} = useDialogPluginComponent()

</script>
