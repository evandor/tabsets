<template>

  <div class="q-gutter-md row items-start fit">
    <q-select dark dense standout filled autofocus
              :placeholder="inputPlaceholder()"
              class="fit q-mx-md"
              :color="props.fromPanel ? 'blue' : 'green'"
              :bg-color="props.fromPanel ? 'primary' : 'secondary'"
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
        <q-item>
          <q-item-section class="text-grey">
            Mark hits in documents
          </q-item-section>
        </q-item>
      </template>

      <template v-slot:prepend>
        <q-icon v-if="highlight" name="flashlight_on" />
        <q-icon v-else-if="!searchStore.term" name="search" />
        <q-icon v-else name="clear" class="cursor-pointer" color="grey" size="12px" @click="clearSearch"/>
      </template>

      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps" class="bg-grey-2">
          <q-item-section avatar>
            <q-icon v-if="scope.opt.id === 'highlight'" name="flashlight_on" color="black"/>
            <q-img v-else :src="scope.opt.chromeTab?.favIconUrl"/>
          </q-item-section>
          <q-item-section>
            <q-item-label v-if="scope.opt.id === 'highlight'" class="text-subtitle2 text-black">highlight in page</q-item-label>
            <q-item-label v-else class="text-subtitle2 text-black">{{ scope.opt.chromeTab?.title }}</q-item-label>

            <q-item-label caption class="text-blue-8">{{ scope.opt.chromeTab?.url }}</q-item-label>
            <q-rating v-if="scope.opt.id !== 'highlight'"
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
import {onMounted, onUnmounted, ref, watch, watchEffect} from "vue";
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
import JsUtils from "src/utils/JsUtils";

const tabsStore = useTabsStore()
const searchStore = useSearchStore()
const search = ref('')
const typed = ref('')
const theHits = ref<Hit[]>([])
const moreHits = ref<boolean>(false)
const router = useRouter()
const route = useRoute()
const typedOrSelected = ref<any>()
const searchBox = ref(null)
const highlight = ref<string | undefined>(undefined)

const props = defineProps({
  fromPanel: {type: Boolean, default: false}
})

function submitSearch() {
  setTimeout(() => {
    console.log("submitting search", searchStore, typedOrSelected.value)
    if (searchStore.term === '') {
      searchStore.term = typedOrSelected.value
    }
    if (props.fromPanel) {
      router.push("/sidepanel/search")
    } else {
      if (route.path === "/search") {
        runSearch(searchStore.term)
      } else {
        router.push("/search")
      }
    }
  }, 200)

}

function checkKeystroke(e: KeyboardEvent) {
  if (useUiStore().ignoreKeypressListener()) {
    return
  }
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
        console.log("search res", res)
        theHits.value = res.result.hits
        moreHits.value = res.result.moreHits
      })
  }
}

const filterFn = (val: any, update: any, abort: any) => {
  console.log("filterFn", val)
  runSearch(val)
  highlight.value = undefined
  useUiStore().highlightTerm = undefined

  setTimeout(() => {
    update(() => {
      //options.value = moreHits ? theHits.value.concat(new Hit()) : theHits.value
      options.value = theHits.value
      //console.log("options", options.value, typeof options.value)
      if (options.value) {
        const pseudoHit = new Hit("highlight", null as unknown as chrome.tabs.Tab, 0,0,0,[], [], "","")
        pseudoHit.name = val
        options.value = options.value.concat(pseudoHit)
      }
    })
  }, 100)
}

const updateSearch = (val: any) => {
  typedOrSelected.value = val
  console.log("updateSearch", typedOrSelected.value)
  if (val?.chromeTab) {
    searchStore.term = ''
    NavigationService.openOrCreateTab(val.chromeTab.url)
  } else if (val?.id === "highlight") {
    console.log("setting highlight", val.name)
    highlight.value = val.name
    useUiStore().setHighlightTerm(val.name)
    JsUtils.runCssHighlight()
  }
}

const inputPlaceholder = () => {
  if (highlight.value) {
    return highlight.value
  }
  if (Math.random() < 0.1) {
    return "use the key '/' for quick access to search"
  }
  if (usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS) && usePermissionsStore().hasFeature(FeatureIdent.ANALYSE_TABS)) {
    const contentCount = useSearchStore().stats.get("content.count")
    // return `Search in ${tabsStore.allTabsCount} tabs (${contentCount} analysed) and ${useBookmarksStore().bookmarksLeaves.length} bookmarks`
    return `Search in ${tabsStore.allTabsCount} tabs and ${useBookmarksStore().bookmarksLeaves.length} bookmarks`
  }
  if (usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS)) {
    return "Search in all of " + tabsStore.allTabsCount + " tabs and " + useBookmarksStore().bookmarksLeaves.length + " bookmarks"
  }
  return "Search in all of " + tabsStore.allTabsCount + " tabs"
}

const clearSearch = () => {
  searchStore.term = ''
  typedOrSelected.value = null
}

</script>
