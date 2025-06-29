<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <ImportFromBookmarksDialogBody
      @import-bookmarks="(a: any) => importBookmarks(a)"
      :in-side-panel="props.inSidePanel"
      :foldersCount="props.foldersCount"
      :bmId="props.bmId"
      :bmTitle="props.bmTitle"
      :count="props.count" />
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import ImportFromBookmarksDialogBody from 'src/bookmarks/dialogues/helper/ImportFromBookmarksDialogBody.vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  inSidePanel: { type: Boolean, default: false },
  count: { type: Number, default: 0 },
  bmId: { type: Number, required: true },
  bmTitle: { type: String, required: true },
  foldersCount: { type: Number, default: 0 },
})

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const importBookmarks = async (a: { bmId: number; recursive: boolean; tsName: string }) => {
  console.log('importing', a)
  onDialogOK(a)
}
</script>
