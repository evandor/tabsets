import {defineStore} from 'pinia';
import {computed, ref} from "vue";
import {StaticSuggestionIdent, Suggestion, SuggestionState} from "src/models/Suggestion";
import {useDB} from "src/services/usePersistenceService";
import _ from "lodash";

const {db} = useDB()


export const useSuggestionsStore = defineStore('suggestions', () => {

  const suggestions = ref<Suggestion[]>([])

  function init() {
    console.debug("initializing SuggestionsService")
    loadSuggestionsFromDb()
  }

  function loadSuggestionsFromDb() {
    db.getSuggestions()
      .then((res: Suggestion[]) => {
        suggestions.value = res
      })
  }

  function addSuggestion(s: Suggestion | undefined) {
    if (s) {
      db.addSuggestion(s)
        .then(() => suggestions.value.push(s))
    }
  }

  function removeSuggestion(ident: StaticSuggestionIdent) {
    // console.log("removing suggestion if exists: ", ident)
    db.removeSuggestion(ident)
      .then(() => suggestions.value = _.filter(suggestions.value, s => s.id !== ident))
  }

  function cancelSuggestion(id: string): Promise<void> {
    return db.setSuggestionState(id, SuggestionState.CANCELED)
      .then((res) => loadSuggestionsFromDb())
  }

  function ignoreSuggestion(id: string): Promise<void> {
    return db.setSuggestionState(id, SuggestionState.IGNORED)
      .then((res) => loadSuggestionsFromDb())
  }

  function applySuggestion(id: string): Promise<Suggestion> {
    return db.setSuggestionState(id, SuggestionState.APPLIED)
      .then((res) => {
        loadSuggestionsFromDb();
        return res
      })

  }

  const getSuggestions = computed(() => {
    return () => _.filter(suggestions.value,
      (s: Suggestion) => s.state === SuggestionState.NEW || s.state === SuggestionState.CANCELED)
  })


  return {
    init,
    addSuggestion,
    getSuggestions,
    ignoreSuggestion,
    cancelSuggestion,
    removeSuggestion,
    applySuggestion
  }

})
