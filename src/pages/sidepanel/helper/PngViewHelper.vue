<template>
  <div class="row q-ma-xs q-mt-lg">
    <div class="col-3 text-caption text-bold">Snapshot</div>
    <div class="col-6 text-right text-caption">
      {{ date.formatDate(created, 'DD.MM.YYYY HH:mm') }}
    </div>
    <div class="col-3 text-caption">
      <q-icon name="o_open_in_new" class="q-ml-md cursor-pointer" @click="openMhtml">
        <q-tooltip class="tooltip-small">Open</q-tooltip>
      </q-icon>
      <q-icon name="o_add" class="q-ml-md cursor-pointer" @click="emits('newSnapshotWasClicked')">
        <q-tooltip class="tooltip-small">New Snapshot</q-tooltip>
      </q-icon>
      <q-icon name="o_delete" class="q-ml-md cursor-pointer" @click="deleteSnapshot()">
        <q-tooltip class="tooltip-small">Delete</q-tooltip>
      </q-icon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { date } from 'quasar'
import { useSnapshotsService } from 'src/snapshots/services/SnapshotsService'

const props = defineProps({
  extension: { type: String, default: 'mhtml' },
  pngId: { type: String, required: true },
  created: { type: Number, required: true },
  index: { type: Number, required: true },
  tabId: { type: String, required: true },
})

const emits = defineEmits(['newSnapshotWasClicked', 'newClipWasClicked'])

const openMhtml = () =>
  window.open(chrome.runtime.getURL(`www/index.html#/mainpanel/${props.extension}/${props.tabId}/${props.index}`))
// const openMhtml = () => window.open(chrome.runtime.getURL(`www/mirror.html#/mainpanel/${props.extension}/${props.tabId}/${props.index}`));
const deleteSnapshot = () => useSnapshotsService().deleteSnapshot(props.tabId)
</script>
