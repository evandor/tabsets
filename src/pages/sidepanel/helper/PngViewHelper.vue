<template>
  <div class="col-3 text-caption text-bold">created</div>
  <div class="col-6 text-right text-caption">{{ date.formatDate(created, 'DD.MM.YYYY HH:mm') }}</div>
  <div class="col-3 text-caption">
    <q-icon name="o_open_in_new" class="q-ml-md cursor-pointer" @click="openMhtml"/>
    <q-icon name="o_delete" class="q-ml-md cursor-pointer" @click="deleteMhtml"/>
  </div>
</template>

<script lang="ts" setup>
import MHtmlService from "src/services/MHtmlService";
import {ref} from "vue";
import {date} from "quasar";

const mhtml = ref<any>()

const props = defineProps({
  pngId: {type: String, required: true},
  created: {type: Number, required: true},
  tabId: {type: String, required: true}
})

// MHtmlService.getMHtml(props.pngId)
//     .then((res: any) => {
//       mhtml.value = res
//     })

const openMhtml = () => window.open(chrome.runtime.getURL('www/index.html#/mainpanel/png/' + props.tabId + "/" + props.pngId));
const deleteMhtml = () => MHtmlService.deleteMHtml(props.tabId, props.pngId)

</script>
