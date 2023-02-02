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
    loadSuggestionsFromDb()
  }

  function loadSuggestionsFromDb() {
    localDb.getSuggestions()
      .then((res: Suggestion[]) => {
        suggestions.value = res
      })
  }

  function addSuggestion(s: Suggestion) {
    localDb.addSuggestion(s)
      .then(() => suggestions.value.push(s))
  }

  function ignoreSuggestion(id: string): Promise<void> {
    return localDb.ignoreSuggestion(id)
      .then((res) => loadSuggestionsFromDb())
  }

  function applySuggestion(id: string): Promise<void> {
    return localDb.ignoreSuggestion(id)
      .then((res) => loadSuggestionsFromDb())
  }

  const getSuggestions = computed(() => {
    return () => _.filter(suggestions.value,
      (s: Suggestion) => s.state === SuggestionState.NEW)
  })


  return {
    init,
    addSuggestion,
    getSuggestions,
    ignoreSuggestion,
    applySuggestion
  }

})
