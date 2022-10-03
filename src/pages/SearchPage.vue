<template>
  <q-page class="q-ma-lg">
    <div class="row">
      <div class="col">
        <div class="text-h6">Search Results for term '{{ searchStore.term }}'</div>
      </div>
    </div>


    <template v-for="ts in tabsetHits">
      <q-expansion-item

        default-opened
        header-class="text-black"
        expand-icon-class="text-black"
        expand-separator>
        <template v-slot:header="{ expanded }">
          <q-item-section>
            <div>
              <span class="text-weight-bold"> &gt; {{ ts.name }}</span>
            </div>
          </q-item-section>
          <q-item-section>{{ ts.tabs.length }} hit(s)</q-item-section>
        </template>
        <q-card>
          <q-card-section>
            <Tablist :tabs="ts.tabs"/>
          </q-card-section>
        </q-card>
      </q-expansion-item>
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
import {Tab} from "src/models/Tab";
import Tablist from "src/components/layouts/Tablist.vue"
import ChromeApi from "src/services/ChromeApi";

const route = useRoute()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()

const term = route.params.term as string

const tabsetHits = ref<Tabset[]>([])

const newSearch = (term: string) => {
  tabsetHits.value = []

  const results = searchStore.fuse.search(term)
  const resultTs = new Tabset(uid(), 'results', [], [])
  _.forEach(results, h => {
    console.log("found", h, h.item)
    resultTs.tabs.push(new Tab(uid(), ChromeApi.createChromeTabObject(h.item.title, h.item.url)))
  })
  tabsetHits.value.push(resultTs)
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
