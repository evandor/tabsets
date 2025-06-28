<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Delete Bookmarks as well</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">
          <div>You just deleted the url</div>
          <div class="q-my-sm text-body2">{{ props.url }}</div>
          <div>{{ infoMsg() }}</div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          flat
          :label="props.bmCount > 1 ? 'Delete Bookmarks' : 'Delete Bookmark'"
          v-close-popup
          @click="deleteBookmarks()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import AppEventDispatcher from 'src/app/AppEventDispatcher'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps<{ url: string; bmCount: number }>()

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const deleteBookmarks = () => {
  AppEventDispatcher.dispatchEvent('delete-bookmark-by-url', { url: props.url })
  //useCommandExecutor().execute(new CreateBookmarkFolderCommand(folderName.value, props.parentFolderId))
  onDialogOK()
}

const infoMsg = () => {
  return `There ${props.bmCount > 1 ? 'are ' : 'is'} ${props.bmCount} bookmark ${props.bmCount > 1 ? 's' : ''} with the same url.`
}
</script>
