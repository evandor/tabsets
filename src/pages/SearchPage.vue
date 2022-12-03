<template>
  <q-page class="q-ma-lg">
    <!--    <div class="row">-->
    <!--      <div class="col">-->
    <!--        <div class="text-h6">Search Results for '{{ searchStore.term }}': {{ tabsetHits.length }} hit(s)</div>-->
    <!--        <div class="text-caption q-mb-md">Not happy with the search results? Try <span-->
    <!--          class="text-blue-9 cursor-pointer" @click="showReindexDialog = true"><u>re-indexing</u></span>.-->
    <!--        </div>-->
    <!--      </div>-->
    <!--    </div>-->

    <q-toolbar class="text-primary">
      <div class="row fit">
        <div class="col-xs-12 col-md-5">
          <q-toolbar-title>
            <div class="row justify-start items-baseline">
              <div><span class="text-dark">Search Results for '{{
                  searchStore.term
                }}': {{ tabsetHits.length }} hit(s)</span>
              </div>
              <!--              <div class="text-caption q-mb-md">Not happy with the search results? Try <span-->
              <!--                class="text-blue-9 cursor-pointer" @click="showReindexDialog = true"><u>re-indexing</u></span>.-->
              <!--              </div>-->
            </div>
          </q-toolbar-title>
        </div>
        <div class="col-xs-12 col-md-7 text-right">

          <!--          <q-btn-->
          <!--            flat dense icon="restore_page"-->
          <!--            color="green" :label="$q.screen.gt.sm ? 'Search with browser...' : ''"-->
          <!--            class="q-mr-md"-->
          <!--            @click="searchWithBrowser">-->
          <!--            <q-tooltip>Use your browsers default search provideder to search for {{ searchStore.term }}</q-tooltip>-->
          <!--          </q-btn>-->

        </div>
      </div>
    </q-toolbar>

    <div class="row">
      <div class="col-8 q-ma-md">
        <template v-for="hit in tabsetHits">
          <q-list>
            <SearchHit :hit="hit"/>
          </q-list>
        </template>

      </div>
      <div class="col-4 q-ma-md">

      </div>
    </div>


  </q-page>
</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import {useRoute} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {useSearchStore} from "src/stores/searchStore";
import {Tabset} from "src/models/Tabset";
import {uid, useQuasar} from "quasar";
import SearchHit from "src/components/layouts/SearchHit.vue"
import ChromeApi from "src/services/ChromeApi";
import {Hit} from "src/models/Hit";
import ReindexDialog from "components/dialogues/ReindexDialog.vue";

const route = useRoute()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()

const term = route.params.term as string

const $q = useQuasar()
const tabsetHits = ref<Hit[]>([])
const showReindexDialog = ref(false)

const newSearch = (term: string) => {
  tabsetHits.value = []

  console.log("searching in ", searchStore.getIndex())
  const results = searchStore.search(term)
  console.log("search results", results)
  _.forEach(results, h => {
    //resultTs.tabs.push(new Hit(uid(), ChromeApi.createChromeTabObject(h.item.title, h.item.url), 0, 0, h.score ))
    tabsetHits.value.push(new Hit(
      uid(),
      ChromeApi.createChromeTabObject(h.item.title, h.item.url, h.item.favIconUrl), 0, 0,
      Math.round(100 - (100 * h.score)),
      h.item.tabsets,
      _.map(h['matches' as keyof object], m => m['key' as keyof object]),
      h.item.description
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

watchEffect(() => {
  if (showReindexDialog.value) {
    $q.dialog({
      component: ReindexDialog
    }).onDismiss(() => {
      showReindexDialog.value = false
    })
  }
})

// const searchWithBrowser = () => {
//   chrome.search.query({dispostion: 'NEW_TAB', text: searchStore.term})
// }


</script>
