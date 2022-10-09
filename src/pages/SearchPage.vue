<template>
  <q-page class="q-ma-lg">
    <div class="row">
      <div class="col">
        <div class="text-h6">Search Results for '{{ searchStore.term }}': {{ tabsetHits.length }} hit(s)</div>
      </div>
    </div>


    <template v-for="hit in tabsetHits">
      <q-list bordered separator>
        <SearchHit :hit="hit"/>
      </q-list>
    </template>

  </q-page>
</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import {useRoute} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {useSearchStore} from "stores/searchStore";
import {Tabset} from "src/models/Tabset";
import {uid} from "quasar";
import SearchHit from "src/components/layouts/SearchHit.vue"
import ChromeApi from "src/services/ChromeApi";
import {Hit} from "src/models/Hit";

const route = useRoute()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()

const term = route.params.term as string

const tabsetHits = ref<Hit[]>([])

const newSearch = (term: string) => {
  tabsetHits.value = []

  const results = searchStore.fuse.search(term)
  console.log("search results", results)
  const resultTs = new Tabset(uid(), 'results', [], [])
  _.forEach(results, h => {
    //resultTs.tabs.push(new Hit(uid(), ChromeApi.createChromeTabObject(h.item.title, h.item.url), 0, 0, h.score ))
    tabsetHits.value.push(new Hit(
      uid(),
      ChromeApi.createChromeTabObject(h.item.title, h.item.url, h.item.favIconUrl), 0, 0,
      Math.round(100 - (100 * h.score)),
      h.item.tabsets
    ))
  })
}

console.log("term", term)
if (term && term.trim() !== '') {
  //newSearch(term)
  searchStore.term = term
}


watchEffect(() => {
  console.log("searchStore.term", searchStore.term)
  if (searchStore.term?.trim() !== '') {
    newSearch(searchStore.term)
  }
})


</script>
