<template>
  <div class="col-3 text-caption text-bold">created</div>
  <div class="col-6 text-right text-caption">{{ date.formatDate(created, 'DD.MM.YYYY HH:mm') }}</div>
  <div class="col-3 text-caption">
    <q-icon name="o_open_in_new" class="q-ml-md cursor-pointer" @click="openMhtml"/>
    <q-icon name="o_delete" class="q-ml-md cursor-pointer" @click="deletePdf()"/>
  </div>
</template>

<script lang="ts" setup>
import {date} from "quasar";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";

const props = defineProps({
  extension: {type: String, default: 'png'},
  pngId: {type: String, required: true},
  created: {type: Number, required: true},
  tabId: {type: String, required: true}
})

const openMhtml = () => window.open(chrome.runtime.getURL(`www/index.html#/mainpanel/${props.extension}/${props.tabId}/${props.pngId}`));
const deletePdf = () => useSnapshotsService().deleteBlob(props.tabId, props.pngId)

</script>
