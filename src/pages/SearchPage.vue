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
          <q-item-section>{{ts.tabs.length}} hit(s)</q-item-section>
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

const route = useRoute()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()

const term = route.params.term as string

const tabsetHits = ref<Tabset[]>([])

const newSearch = (term: string) => {
  tabsetHits.value = []

  for (let [key, value] of tabsStore.tabsets) {
    //console.log("searching in key", key)
    const hits = _.filter(value.tabs, t => {
      if (t.chromeTab.url) {
        //console.log("checking ", t.chromeTab.url)
        return t.chromeTab.url.indexOf(term) >= 0
      }
      return false;
    })
    // const rs: object[] = []
    if (hits.length > 0) {
      const resultTs = new Tabset(uid(), value.name, [], [])
      _.forEach(hits, h => {
        resultTs.tabs.push(new Tab(uid(), h.chromeTab))
      })
      tabsetHits.value.push(resultTs)
    }
  }
}

watchEffect(() => {
  console.log("searchStore.term", searchStore.term)
  if (searchStore.term?.trim() !== '') {
    newSearch(searchStore.term)
  }
})


</script>
