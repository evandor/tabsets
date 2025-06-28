import { collection, deleteDoc, doc, DocumentData, getDoc, getDocs, setDoc } from 'firebase/firestore'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { Suggestion, SuggestionState } from 'src/suggestions/domain/models/Suggestion'
import SuggestionsPersistence from 'src/suggestions/persistence/SuggestionsPersistence'
import { useAuthStore } from 'stores/authStore'

function suggestionsCollection() {
  return collection(FirebaseServices.getFirestore(), `users/${useAuthStore().user.uid}/suggestions`)
}

function suggestionsDoc(id: string) {
  return doc(FirebaseServices.getFirestore(), `users/${useAuthStore().user.uid}/suggestions/${id}`)
}

class FirestoreSuggestionsPersistence extends SuggestionsPersistence {
  init(): Promise<any> {
    return Promise.resolve(undefined)
  }

  async getSuggestions(): Promise<Suggestion[]> {
    if (!useAuthStore().user) {
      return Promise.resolve([])
    }
    const suggestions = await getDocs(suggestionsCollection())
    const result: Suggestion[] = []
    suggestions.forEach((doc) => {
      result.push(doc.data() as Suggestion)
    })
    return result
  }

  async addSuggestion(suggestion: Suggestion): Promise<void> {
    const allSuggestions = await this.getSuggestions()
    if (allSuggestions.findIndex((s: Suggestion) => s.url === suggestion.url) >= 0) {
      return Promise.reject(`suggestion with url '${suggestion.url}' already exists`)
    } else {
      //const s = new Suggestion(uid(), 'title', 'url', SuggestionType.CONTENT_CHANGE)
      await setDoc(suggestionsDoc(suggestion.id), JSON.parse(JSON.stringify(suggestion)))
    }
    return Promise.resolve(undefined)
  }

  removeSuggestion(ident: string): Promise<any> {
    return deleteDoc(suggestionsDoc(ident))
  }

  async setSuggestionState(suggestionId: string, state: SuggestionState): Promise<Suggestion> {
    console.log('setting suggestion to state', suggestionId, state)
    const doc = suggestionsDoc(suggestionId)
    const suggestion: Suggestion | undefined = ((await getDoc(doc))?.data() as Suggestion) || undefined
    if (suggestion) {
      suggestion.state = state
      await setDoc(doc, suggestion)
      return Promise.resolve(suggestion)
    }
    return Promise.reject('could not update suggestion')
  }

  async clearAll(): Promise<void> {
    const suggestions = await getDocs(suggestionsCollection())
    suggestions.forEach((doc: DocumentData) => {
      console.log('deleting', doc.data())
      deleteDoc(doc.ref)
    })
    return Promise.resolve()
  }
}

export default new FirestoreSuggestionsPersistence()
