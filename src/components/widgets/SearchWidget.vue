<template>

  <div class="q-gutter-md row items-start fit">
    <q-select dark dense standout
              :placeholder="inputPlaceholder()"
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
import {onMounted, onUnmounted, ref} from "vue";
import {useSearchStore} from "src/stores/searchStore";
import {Hit} from "src/models/Hit";
import {useRoute, useRouter} from "vue-router";
import NavigationService from "src/services/NavigationService";
import {SearchIndexQuery} from "src/domain/queries/SearchIndexQuery";
import {useQueryExecutor} from "src/services/QueryExecutor";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useUiStore} from "src/stores/uiStore";
import {FeatureIdent} from "src/models/AppFeature";

const tabsStore = useTabsStore()
const searchStore = useSearchStore()
const search = ref('')
const theHits = ref<Hit[]>([])
const moreHits = ref<boolean>(false)
const router = useRouter()
const route = useRoute()
const typedOrSelected = ref<any>()
const searchBox = ref(null)

function submitSearch() {
  setTimeout(() => {
    if (searchStore.term === '') {
      searchStore.term = typedOrSelected.value
    }
    if (route.path === "/search") {
      runSearch(searchStore.term)
    } else {
      router.push("/search")
    }
  }, 200)

}

function checkKeystroke(e: KeyboardEvent) {
  if (e.key === '/' && searchBox.value) {
    e.preventDefault()
    // @ts-ignore
    searchBox.value.focus()
    search.value = ''
  }
}

onMounted(() => {
  window.addEventListener('keypress', checkKeystroke);
})

onUnmounted(() => {
  window.removeEventListener('keypress', checkKeystroke);
})

const options = ref<Hit[]>([])
const model = ref(null)

const runSearch = (term: string) => {
  if (term && term.trim().length > 2) {
    searchStore.term = term
    useQueryExecutor()
      .queryFromUi(new SearchIndexQuery(term))
      .then(res => {
        theHits.value = res.result.hits
        moreHits.value = res.result.moreHits
      })
  }
}

const filterFn = (val: any, update: any, abort: any) => {
  runSearch(val)

  setTimeout(() => {
    update(() => {
      //options.value = moreHits ? theHits.value.concat(new Hit()) : theHits.value
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

const inputPlaceholder = () => {
  if (Math.random() < 0.1) {
    return "use the key '/' for quick access to search"
  }
  if (usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS) && usePermissionsStore().hasFeature(FeatureIdent.ANALYSE_TABS)) {
    const contentCount = useSearchStore().stats.get("content.count")
    return `Search inside ${tabsStore.allTabsCount} tabs (${contentCount} analysed) and ${useBookmarksStore().bookmarksLeaves.length} bookmarks`
  }
  if (usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS)) {
    return "Search inside all of " + tabsStore.allTabsCount + " tabs and " + useBookmarksStore().bookmarksLeaves.length + " bookmarks"
  }
  return "Search inside all of " + tabsStore.allTabsCount + " tabs"
}

</script>
