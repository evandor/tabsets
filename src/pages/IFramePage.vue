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
            color="primary"
            label="Open in new tab"
            class="q-mr-md"
            @click="openInNewTab"
          >
            <q-tooltip>Open in new tab</q-tooltip>
          </q-btn>

          <q-btn
            flat dense icon="o_reply"
            color="primary"
            label="Back to tabsets"
            class="q-mr-md"
            @click="router.push('/tabset')"
          >
            <q-tooltip>Back to tabsets</q-tooltip>
          </q-btn>

        </div>
      </div>
    </q-toolbar>

    <iframe id="tabIFrame" :src='src' frameBorder="0" :style="iFrameStyle" />

  </q-page>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRoute, useRouter} from "vue-router";
import {date} from "quasar"
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"

const route = useRoute()
const router = useRouter()

const tabId = ref()
const title = ref()
const data = ref<string[]>([])
const src = ref('data:text/html,<p>loading...</p>')
const created = ref('')

// const currentLog = console.log
// console.log = (msg, args) => {
//   if (msg !== undefined) {
//     data.value.push(msg);
//     //console.log("msg:",msg)
//   }
// //  currentLog.apply(null, args);
//   if (args) {
//     currentLog.apply(this, Array.prototype.slice.call(args));
//   }
// }

// window.onerror = function() {
//   alert("Error occurred while loading image");
// };

watchEffect(() => {
  tabId.value = route.params.tabId as string
  console.log("watching", tabId.value)
  const found = _.find(useTabsStore().getCurrentTabs, t => t.id === route.params.tabId)
  if (found) {
    //console.log("tabIFrame", window.document?.getElementById('tabIFrame'))
    const iFrame: HTMLIFrameElement = window.document?.getElementById('tabIFrame') as unknown as HTMLIFrameElement
    if (iFrame) {
      iFrame.setAttribute("style", "overflow:hidden;height:" + (window.innerHeight - 50) + "px;width:100%;border:0px");
      // https://stackoverflow.com/questions/15273042/catch-error-if-iframe-src-fails-to-load-error-refused-to-display-http-ww
      // iFrame.onerror = function (event: any) {
      //   console.log("hier0", JSON.stringify(event))
      //   var that = document.getElementById('tabIFrame');
      //   console.log("hier1+", iFrame.title)
      //   console.log("hier1-", that?.innerHTML.length)
      //   const isLoaded = event.target.contentWindow.window.length // 0 or 1
      //   console.log("hier1a", isLoaded)
      //   //alert(isLoaded)
      //   // try {
      //   //   // @ts-ignore
      //   //   (that?.contentWindow || that?.contentDocument).location.href;
      //   //   console.log("hier3")
      //   // } catch (err) {
      //   //   console.log('err:' + err);
      //   //   src.value = 'data:text/html,<p>' + err + '</p>'
      //   // }
      // }
      src.value = found.chromeTab.url || 'data:text/html,<p>loading....</p>'
    }

  }

})

const openInNewTab = () => console.log("not implemented")

const iFrameStyle = () => {
  const v = "overflow:hidden;height:" + (window.innerHeight - 50) + "px;width:100%;border:0px"
  console.log("v", v)
  return v
}

</script>
