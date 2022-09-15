<template>
  <q-page class="q-ma-lg">
    <div class="row">
      <div class="col">
        <div class="text-h6">Tabset Extension</div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div class="text-body1">
          Search Results for term '{{term}}'
        </div>
      </div>
    </div>
    <div class="row" v-for="key in result.keys()">
      <div class="col cursor-pointer" @click="openTab(key)" >{{key}}</div>
<!--      <div class="col">{{r.tabsetName}}</div>-->
<!--      <div class="col">{{r.tabsetId}}</div>-->
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {useRoute} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import Navigation from "src/services/Navigation";

const route = useRoute()
const tabsStore = useTabsStore()

const term = route.params.term as string
console.log("term", term)
const result = ref<Map<string, object>>(new Map())

console.log("tabsStore.tabsets", tabsStore.tabsets)
for (let [key, value] of tabsStore.tabsets) {
  console.log("searching in key", key)
  const hits = _.filter(value.tabs, t => {
    if (t.chromeTab.url) {
      console.log("checking ", t.chromeTab.url)
      return t.chromeTab.url.indexOf(term) >= 0
    }
    return false;
  })
  console.log("hits", hits)
  // const rs: object[] = []
  _.forEach(hits, h => {
    // rs.push({
    //   url:  h.url,
    //   tabsetName: value.name,
    //   tabsetId: key.replace("bookmrkx.tabsContexts.", "")
    // })
    if (result.value.has(h.chromeTab.url || '')) {

    } else {
      result.value.set(h.chromeTab.url || '???', {tabsetName: value.name})
    }
  })


  //console.log("found", key, hits);
}

function openTab(url: string) {
  console.log("opening", url)
  Navigation.openOrCreateTab(url)
}


//const authStore = useAuthStore()
</script>
