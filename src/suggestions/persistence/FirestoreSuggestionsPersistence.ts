import { collection, deleteDoc, doc, DocumentData, getDoc, getDocs, setDoc } from 'firebase/firestore'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import { Suggestion, SuggestionState } from 'src/suggestions/domain/models/Suggestion'
import SuggestionsPersistence from 'src/suggestions/persistence/SuggestionsPersistence'
import { useAuthStore } from 'stores/authStore'

function suggestionsCollection(firebaseServices: IFirebaseServices) {
  return collection(firebaseServices.getFirestore(), `users/${useAuthStore().user.uid}/suggestions`)
}

function suggestionsDoc(firebaseServices: IFirebaseServices, id: string) {
  return doc(firebaseServices.getFirestore(), `users/${useAuthStore().user.uid}/suggestions/${id}`)
}

class FirestoreSuggestionsPersistence extends SuggestionsPersistence {
  private firebaseServices: IFirebaseServices = null as unknown as IFirebaseServices
  init(firebaseServices: IFirebaseServices): Promise<any> {
    this.firebaseServices = firebaseServices
    return Promise.resolve(undefined)
  }

  async getSuggestions(): Promise<Suggestion[]> {
    if (!useAuthStore().user) {
      return Promise.resolve([])
    }
    const suggestions = await getDocs(suggestionsCollection(this.firebaseServices))
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
      await setDoc(suggestionsDoc(this.firebaseServices, suggestion.id), JSON.parse(JSON.stringify(suggestion)))
    }
    return Promise.resolve(undefined)
  }

  removeSuggestion(ident: string): Promise<any> {
    return deleteDoc(suggestionsDoc(this.firebaseServices, ident))
  }

  async setSuggestionState(suggestionId: string, state: SuggestionState): Promise<Suggestion> {
    console.log('setting suggestion to state', suggestionId, state)
    const doc = suggestionsDoc(this.firebaseServices, suggestionId)
    const suggestion: Suggestion | undefined = ((await getDoc(doc))?.data() as Suggestion) || undefined
    if (suggestion) {
      suggestion.state = state
      await setDoc(doc, suggestion)
      return Promise.resolve(suggestion)
    }
    return Promise.reject('could not update suggestion')
  }

  async clearAll(): Promise<void> {
    const suggestions = await getDocs(this.firebaseServices, suggestionsCollection())
    suggestions.forEach((doc: DocumentData) => {
      console.log('deleting', doc.data())
      deleteDoc(doc.ref)
    })
    return Promise.resolve()
  }
}

export default new FirestoreSuggestionsPersistence()
