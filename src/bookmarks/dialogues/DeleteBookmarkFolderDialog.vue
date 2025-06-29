<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <DeleteBookmarkFolderDialogBody :folderId="props.folderId" />
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import DeleteBookmarkFolderDialogBody from 'src/bookmarks/dialogues/DeleteBookmarkFolderDialogBody.vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  folderId: { type: String, required: true },
})

const { dialogRef, onDialogHide } = useDialogPluginComponent()
</script>
