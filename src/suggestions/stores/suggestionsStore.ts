import _ from 'lodash'
import { defineStore } from 'pinia'
import { useFirebaseServices } from 'src/services/firebase/useFirebaseServices'
import { Suggestion, SuggestionState, SuggestionType } from 'src/suggestions/domain/models/Suggestion'
import SuggestionsPersistence from 'src/suggestions/persistence/SuggestionsPersistence'
import { computed, ref } from 'vue'

export const useSuggestionsStore = defineStore('suggestions', () => {
  const suggestions = ref<Suggestion[]>([])

  let storage: SuggestionsPersistence = null as unknown as SuggestionsPersistence

  async function init(db: SuggestionsPersistence) {
    storage = db
    await storage.init(useFirebaseServices().firebaseServices)
    await loadSuggestionsFromDb()
  }

  async function loadSuggestionsFromDb() {
    //console.log('loading suggestions')
    if (storage) {
      suggestions.value = await storage.getSuggestions()
    }
  }

  async function cleanup(typesToClean: SuggestionType[]) {
    const allSuggestions = await storage.getSuggestions()
    allSuggestions.forEach((s: Suggestion) => {
      if (typesToClean.indexOf(s.type) >= 0 && s.state !== 'IGNORED') {
        console.log(`cleaning up suggestion ${s.id}`)
        storage.removeSuggestion(s.id)
      }
    })
  }

  async function addSuggestion(s: Suggestion | undefined) {
    console.debug('about to add suggestion...', s)
    await cleanup(['SWITCH_TABSET'])
    if (!s) {
      return Promise.reject('suggestion undefined')
    }
    try {
      await storage.addSuggestion(s)
      //console.log("%cpushing", "color:red", s)
      suggestions.value.push(s)
      return Promise.resolve(true)
    } catch (err) {
      console.log('rejected adding due to: ', err)
      return Promise.resolve(false)
    }
  }

  function inactivateSuggestion(s: Suggestion | undefined) {
    if (s) {
      s.state = 'INACTIVE'
      console.log('about to inactivate suggestion', s)
      storage
        .addSuggestion(s)
        .then(() => suggestions.value.push(s))
        .catch((err) => {
          console.log('rejected adding due to:', err)
        })
    }
  }

  function removeSuggestion(ident: string): Promise<any> {
    if (!storage) {
      return Promise.reject('could not remove suggestions as storage is not defined')
    }
    return storage.removeSuggestion(ident).then(() => {
      suggestions.value = _.filter(suggestions.value, (s: any) => s.id !== ident)
      console.log('suggestions set to ', suggestions.value)
    })
  }

  async function updateSuggestionState(id: string, state: SuggestionState) {
    return storage.setSuggestionState(id, state).then((res: any) => loadSuggestionsFromDb())
  }

  function applySuggestion(id: string): Promise<Suggestion> {
    console.log('%capplied suggestion', 'background-color:grey', id)
    return storage.setSuggestionState(id, 'APPLIED').then((res: any) => {
      loadSuggestionsFromDb()
      return res
    })
  }

  const getSuggestions = computed(() => {
    return (states: SuggestionState[]): Suggestion[] => {
      // console.log('checking for states', states)
      return _.filter(suggestions.value, (s: Suggestion) => {
        for (const state of states) {
          if (state === s.state) {
            // console.log(' - ', s.state)
            return true
          }
        }
        return false
      })
    }
  })

  const getSuggestion = computed(() => {
    return (suggestionId: string) => _.find(suggestions.value, (s: any) => s.id === suggestionId)
  })

  const getSuggestionForUrl = computed(() => {
    return (url: string) => _.find(suggestions.value, (s: any) => s.id === btoa(url))
  })

  const clearAll = () => {
    storage.clearAll().then(() => {
      suggestions.value = []
    })
  }

  return {
    init,
    loadSuggestionsFromDb,
    addSuggestion,
    getSuggestions,
    getSuggestion,
    updateSuggestionState,
    removeSuggestion,
    applySuggestion,
    inactivateSuggestion,
    getSuggestionForUrl,
    clearAll,
  }
})
