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
          To get started, click on "current" on the left. This will
          open your current set of tabs on a new page where you can
          organize them and store them, giving this set of tabs a name.
        </div>
      </div>
    </div>
    <div class="row">
      {{ result }}
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {useRoute} from "vue-router";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"

const route = useRoute()
const tabStore = useTabsStore()

const term = route.params.term as string
console.log("term", term)
const result = ref<any[]>([])


for (let [key, value] of tabStore.tabsets) {

  const hits = _.filter(value.tabs, t => {
    if (t.url) {
      return t.url.indexOf(term) >= 0
    }
    return false;
  })
  _.forEach(hits, h => {
    result.value.push(h.url)
  })
  //console.log("found", key, hits);
}



//const authStore = useAuthStore()
</script>
