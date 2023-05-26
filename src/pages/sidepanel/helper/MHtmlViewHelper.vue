<template>
  <div class="col-3 text-caption text-bold">created</div>
  <div class="col-6 text-right text-caption">{{ date.formatDate(mhtml?.created, 'DD.MM.YYYY HH:mm') }}</div>
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
  mhtmlId: {type: String, required: true},
  tabId: {type: String, required: true}
})

MHtmlService.getMHtml(props.mhtmlId)
  .then((res: any) => {
    mhtml.value = res
  })

const openMhtml = () => window.open(chrome.runtime.getURL('www/index.html#/mainpanel/mhtml/' + props.mhtmlId));
const deleteMhtml = () => MHtmlService.deleteMHtml(props.tabId, props.mhtmlId)

</script>
