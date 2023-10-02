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

import {ref, watchEffect} from "vue";
import {useSearchStore} from "src/stores/searchStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";

const props = defineProps({
  searchTerm: {type: String, default: ''},
  searchHits: {type: Number, required: false}
})

const searchStore = useSearchStore()
const search = ref(props.searchTerm)
const typedOrSelected = ref<any>()
const highlight = ref<string | undefined>(undefined)

watchEffect(() => {
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

</script>
