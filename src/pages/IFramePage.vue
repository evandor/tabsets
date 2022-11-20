<template>

  <q-page padding>
    <q-toolbar class="text-primary">
      <div class="row fit">
        <div class="col-xs-12 col-md-5">
          <q-toolbar-title class="q-mb-lg">
            <div class="row justify-start items-baseline">
              <div class="col-1"><span class="text-dark">Page: {{ tabId }}</span></div>
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


    <iframe id="tabIFrame" :src='src' frameBorder="0"
            :style="iFrameStyle"/>
  </q-page>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import {date} from "quasar"
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"

const route = useRoute()

const tabId = ref()
const title = ref()
const src = ref('data:text/html,<p>loading...</p>')
const created = ref('')


watchEffect(() => {
  tabId.value = route.params.tabId as string
  const found = _.find(useTabsStore().getCurrentTabs, t => t.id === route.params.tabId)
  if (found) {
    console.log("window.document?.getElementById('tabIFrame')", window.document?.getElementById('tabIFrame'))
    window.document?.getElementById('tabIFrame')?.setAttribute("style", "overflow:hidden;height:" + (window.innerHeight - 50) + "px;width:100%;border:0px");
    src.value = found.chromeTab.url || 'data:text/html,<p>loading....</p>'
  }

})

const openInNewTab = () => console.log("not implemented")

const iFrameStyle = () => {
  const v = "overflow:hidden;height:" + (window.innerHeight - 50) + "px;width:100%;border:0px"
  console.log("v", v)
  return v
}

</script>
