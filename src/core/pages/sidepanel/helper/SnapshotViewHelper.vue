<template>
  <div class="row q-ma-none q-mt-xs">
    <div class="col-5 text-caption text-bold">{{ title() }}</div>
    <div class="col-5 text-caption">{{ date.formatDate(created, 'DD.MM.YYYY HH:mm') }}</div>
    <div class="col-2 text-caption text-right">
      <q-icon v-if="props.extension === BlobType.HTML" name="o_edit" class="q-ml-xs cursor-pointer" @click="editHtml()">
        <q-tooltip class="tooltip-small">Edit</q-tooltip>
      </q-icon>
      <q-icon name="o_open_in_new" class="q-ml-xs cursor-pointer" @click="openMhtml">
        <q-tooltip class="tooltip-small">Open</q-tooltip>
      </q-icon>
      <q-icon name="o_delete" class="q-ml-xs cursor-pointer" @click="deleteSnapshot()">
        <q-tooltip class="tooltip-small">Delete</q-tooltip>
      </q-icon>
    </div>
    <div class="col-12" v-if="props.wasEdited" @click="emits('saveSnapshot', snapshotId)">save!</div>
  </div>
</template>

<script lang="ts" setup>
import { date } from 'quasar'
import { BlobType } from 'src/snapshots/models/BlobMetadata'
import { useSnapshotsService } from 'src/snapshots/services/SnapshotsService'

const props = defineProps({
  extension: { type: String, default: 'mhtml' },
  created: { type: Number, required: true },
  wasEdited: { type: Boolean, default: false },
  snapshotId: { type: String, required: true },
})

const emits = defineEmits(['saveSnapshot'])

const editHtml = () =>
  window.open(chrome.runtime.getURL(`www/index.html#/mainpanel/${props.extension}/${props.snapshotId}?edit=true`))

const openMhtml = () =>
  window.open(chrome.runtime.getURL(`www/index.html#/mainpanel/${props.extension}/${props.snapshotId}`))
// const openMhtml = () => window.open(chrome.runtime.getURL(`www/mirror.html#/mainpanel/${props.extension}/${props.tabId}/${props.index}`));
const deleteSnapshot = () => useSnapshotsService().deleteSnapshot(props.snapshotId)

const title = () => {
  switch (props.extension.toLowerCase()) {
    case 'mhtml':
      return 'MHtml Snapshot'
    case 'html':
      return 'HTML Snapshot'
    case 'png':
      return 'Image Snapshot'
    case 'pdf':
      return 'PDF Snapshot'
    default:
      return 'Session'
  }
}
</script>
