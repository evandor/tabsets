import {defineStore} from 'pinia';
import {computed, ref} from "vue";
import {StaticSuggestionIdent, Suggestion, SuggestionState} from "src/models/Suggestion";
import {useDB} from "src/services/usePersistenceService";
import _ from "lodash";
import PersistenceService from "src/services/PersistenceService";

// seems like it is a good idea to initialize the stores with the db(s) needed
//const {db} = useDB()
let storage: PersistenceService = null as unknown as PersistenceService


export const useSuggestionsStore = defineStore('suggestions', () => {

  const suggestions = ref<Suggestion[]>([])

  function init(providedDb: PersistenceService) {
    console.debug("initializing SuggestionsService")
    storage = providedDb
    loadSuggestionsFromDb()
  }

  function loadSuggestionsFromDb() {
    if (storage) {
      storage.getSuggestions()
        .then((res: Suggestion[]) => {
          suggestions.value = res
        })
    }
  }

  function addSuggestion(s: Suggestion | undefined) {
    if (s) {
      storage.addSuggestion(s)
        .then(() => suggestions.value.push(s))
    }
  }

  function removeSuggestion(ident: StaticSuggestionIdent) {
    if (storage) {
      storage.removeSuggestion(ident)
        .then(() => suggestions.value = _.filter(suggestions.value, s => s.id !== ident))
    } else {
      console.warn("could not remove suggestions as storage is not defined")
    }
  }

  function cancelSuggestion(id: string): Promise<void> {
    return storage.setSuggestionState(id, SuggestionState.CANCELED)
      .then((res: any) => loadSuggestionsFromDb())
  }

  function ignoreSuggestion(id: string): Promise<void> {
    return storage.setSuggestionState(id, SuggestionState.IGNORED)
      .then((res: any) => loadSuggestionsFromDb())
  }

  function applySuggestion(id: string): Promise<Suggestion> {
    return storage.setSuggestionState(id, SuggestionState.APPLIED)
      .then((res: any) => {
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
