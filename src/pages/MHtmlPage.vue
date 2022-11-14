<template>

  <q-page padding>
    <q-toolbar class="text-primary">
      <div class="row fit">
        <div class="col-xs-12 col-md-5">
          <q-toolbar-title class="q-mb-lg">
            <div class="row justify-start items-baseline">
              <div class="col-1"><span class="text-dark">Archived Page: {{ title }}</span></div>
            </div>
            <div class="text-caption">Created {{ date.formatDate(created, 'DD.MM.YYYY HH:mm') }}</div>
          </q-toolbar-title>
        </div>
        <div class="col-xs-12 col-md-7 text-right">

          <q-btn
            flat dense icon="o_open_in_new"
            color="green"
            label="Open in new tab"
            class="q-mr-md"
            @click="openInNewTab"
          >
            <q-tooltip>Open in new tab</q-tooltip>
          </q-btn>

        </div>
      </div>
    </q-toolbar>


    <iframe id="mhtmlframe" src='data:text/html,<p>loading...</p>' frameBorder="0"
            style="overflow:hidden;height:100%;width:100%;border:0px"/>
  </q-page>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {date} from "quasar"

const route = useRoute()

const encodedUrl = ref()
const title = ref()
const created = ref('')


watchEffect(() => {
  encodedUrl.value = route.params.encodedUrl as string
  if (encodedUrl) {
    IndexedDbPersistenceService.getMHtmlInline(encodedUrl.value)
      .then((res: object) => {
        window.document?.getElementById('mhtmlframe')?.setAttribute("style", "overflow:hidden;height:" + (window.innerHeight - 50) + "px;width:100%;border:0px");
        window.document?.getElementById('mhtmlframe')?.setAttribute("srcdoc", res['html' as keyof object]);
        title.value = res['title' as keyof object]
        created.value = res['created' as keyof object]
        // navigator.storage.estimate().then(({usage, quota}) => {
        //   console.log(`Using ${usage} out of ${quota} bytes.`);
        // });
      })
  }
})

const openInNewTab = () => IndexedDbPersistenceService.getMHtml(encodedUrl.value)


</script>
