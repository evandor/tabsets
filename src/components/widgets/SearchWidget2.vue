<template>

  <div class="q-gutter-md row items-start fit">
    <q-input dense standout filled
             ref="searchInputRef"
             :placeholder="inputPlaceholder()"
             class="fit q-mx-md"

             v-model="search">
    </q-input>
  </div>


</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import {useSearchStore} from "src/search/stores/searchStore";

const props = defineProps({
  searchTerm: {type: String, default: ''},
  searchHits: {type: Number, required: false}
})

const searchStore = useSearchStore()
const search = ref(props.searchTerm)
const searchInputRef = ref<HTMLInputElement | null>(null);
const highlight = ref<string | undefined>(undefined)

onMounted(() => {
  setTimeout(() => {
      if (searchInputRef.value) {
        searchInputRef.value?.focus()
      }
    }, 500
  )
})


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
  return "Search all tabs and bookmarks"
}

</script>
