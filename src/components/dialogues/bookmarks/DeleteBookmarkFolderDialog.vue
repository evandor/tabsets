<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <DeleteBookmarkFolderDialogBody />
  </q-dialog>
</template>

<script lang="ts" setup>

import {useDialogPluginComponent} from "quasar";
import DeleteBookmarkFolderDialogBody from "components/dialogues/bookmarks/DeleteBookmarkFolderDialogBody.vue";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  inSidePanel: {type: Boolean, default: false},
  count: {type: Number, default: 0}
})

const {dialogRef, onDialogHide} = useDialogPluginComponent()

</script>
