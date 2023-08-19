<template>

  <div class="q-gutter-md row items-start fit">
    <q-input dense standout filled autofocus
             :placeholder="inputPlaceholder()"
             class="fit q-mx-md"
             color="primary"
             bg-color="white"
             label-color="primary"
             v-model="search">
    </q-input>
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
import {useCommandExecutor} from "src/services/CommandExecutor";
import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";

const props = defineProps({
  searchTerm: {type: String, default: ''},
  searchHits: {type: Number, required: false}
})

const tabsStore = useTabsStore()
const searchStore = useSearchStore()
const search = ref(props.searchTerm)
const router = useRouter()
const route = useRoute()
const typedOrSelected = ref<any>()
const highlight = ref<string | undefined>(undefined)

watchEffect(() => {
 // console.log("search", search.value)
  searchStore.term = search.value
})

const inputPlaceholder = () => {
  if (highlight.value) {
    return highlight.value
  }
  if (props.searchHits && props.searchHits > 0) {
    return `Found ${props.searchTerm} ${props.searchHits} time(s)`
  }
  if (usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS)) {
    return "Search in all tabs and bookmarks"
  }
  return "Search in all tabs"
}

const clearSearch = () => {
  searchStore.term = ''
  typedOrSelected.value = null
}

const tabsetName = (id: string) => id.split('|')[1] || '???'


</script>
