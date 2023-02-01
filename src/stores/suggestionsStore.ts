import {defineStore} from 'pinia';
import {computed, ref, watch} from "vue";
import {useQuasar} from "quasar";
import {useRoute} from "vue-router";
import {Suggestion, SuggestionState} from "src/models/Suggestion";
import {useDB} from "src/services/usePersistenceService";
import _ from "lodash";

const {localDb} = useDB()

export const useSuggestionsStore = defineStore('suggestions', () => {

  const suggestions = ref<Suggestion[]>([])

  function init() {
    console.debug("initializing SuggestionsService")
    localDb.getSuggestions()
      .then((res: Suggestion[]) => {
        suggestions.value = res
      })
  }

  watch(suggestions, (val: Object) => {
    //$q.localStorage.set("ui.tabsetIdForNewTab", val)
    console.log("watching suggestions", suggestions.value)
  }, {deep: true})

  function ignoreSuggestion(id: string): Promise<void> {
    return localDb.ignoreSuggestion(id)
  }

  const getSuggestions = computed(() => {
    return () => _.filter(suggestions.value,
      (s: Suggestion) => s.state === SuggestionState.NEW)
  })


  return {
    init,
    getSuggestions,
    ignoreSuggestion
  }

})
