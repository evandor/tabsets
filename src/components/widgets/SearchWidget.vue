<template>

  <div class="q-gutter-md row items-start fit">
    <q-select dark dense standout
              class="fit q-mx-md "
              :model-value="search"
              ref="searchBox"
              hide-dropdown-icon
              @update:model-value="val => updateSearch( val)"
              @keydown.enter.prevent="submitSearch()"
              use-input
              new-value-mode="add"
              :options="options"
              @filter="filterFn">

      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">
            No results
          </q-item-section>
        </q-item>
      </template>

      <template v-slot:prepend>
        <q-icon v-if="search === ''" name="search"/>
        <q-icon v-else name="clear" class="cursor-pointer" @click="search = ''"/>
      </template>

      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps" class="bg-white">
          <q-item-section avatar>
            <q-img :src="scope.opt.chromeTab.favIconUrl"/>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-subtitle2 text-black">{{ scope.opt.chromeTab.title }}</q-item-label>
            <q-item-label caption class="text-blue-8">{{ scope.opt.chromeTab.url }}</q-item-label>
            <q-rating
              :model-value="Math.round(scope.opt.score / 18)"
              size="13px"
              color="warning"
              readonly
            />
          </q-item-section>
        </q-item>
      </template>

    </q-select>
  </div>


</template>

<script lang="ts" setup>
import {useTabsStore} from "src/stores/tabsStore";
import {ref} from "vue";
import {useSearchStore} from "stores/searchStore";
import {Hit} from "src/models/Hit";
import {useRoute, useRouter} from "vue-router";
import NavigationService from "src/services/NavigationService";
import {SearchIndexQuery} from "src/domain/queries/SearchIndexQuery";
import {useQueryExecutor} from "src/services/QueryExecutor";

const tabsStore = useTabsStore()
const searchStore = useSearchStore()
const search = ref('')
const theHits = ref<Hit[]>([])
const router = useRouter()
const route = useRoute()
const typedOrSelected = ref<any>()

function submitSearch() {
  setTimeout(() => {
    if (searchStore.term === '') {
      searchStore.term = typedOrSelected.value
    }
    if (route.path === "/search") {
      runSeach(searchStore.term)
    } else {
      router.push("/search")
    }
  }, 200)

}

const options = ref<Hit[]>([])
const model = ref(null)

const runSeach = (term: string) => {
  if (term && term.trim().length > 2) {
    searchStore.term = term
    useQueryExecutor()
      .queryFromUi(new SearchIndexQuery(term))
      .then(res => {theHits.value = res.result})
  }
}

const filterFn = (val: any, update: any, abort: any) => {
  runSeach(val)

  setTimeout(() => {
    update(() => {
      options.value = theHits.value
    })
  }, 100)
}

const updateSearch = (val: any) => {
  typedOrSelected.value = val
  if (val.chromeTab) {
    NavigationService.openOrCreateTab(val.chromeTab.url)
  }
}


</script>
