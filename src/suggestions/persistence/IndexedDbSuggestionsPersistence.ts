import { IDBPDatabase, openDB } from 'idb'
import _ from 'lodash'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import { Suggestion, SuggestionState } from 'src/suggestions/domain/models/Suggestion'
import SuggestionsPersistence from 'src/suggestions/persistence/SuggestionsPersistence'

class IndexedDbSuggestionsPersistence extends SuggestionsPersistence {
  STORE_IDENT = 'suggestions'

  private db: IDBPDatabase = null as unknown as IDBPDatabase

  async init(firebaseServices: IFirebaseServices) {
    this.db = await this.initDatabase()
    // console.debug(` ...initialized suggestions: DB`, '✅')
    return Promise.resolve('')
  }

  private async initDatabase(): Promise<IDBPDatabase> {
    const ctx = this
    return await openDB('suggestionsDB', 1, {
      // upgrading see https://stackoverflow.com/questions/50193906/create-index-on-already-existing-objectstore
      upgrade(db) {
        if (!db.objectStoreNames.contains(ctx.STORE_IDENT)) {
          console.log('creating db', ctx.STORE_IDENT)
          db.createObjectStore(ctx.STORE_IDENT)
        }
      },
    })
  }

  async getSuggestions(): Promise<Suggestion[]> {
    return this.db ? this.db.getAll(this.STORE_IDENT) : Promise.resolve([])
  }

  async addSuggestion(suggestion: Suggestion): Promise<void> {
    const suggestions = await this.getSuggestions()
    //console.log('%csuggestions from db', 'color:red', suggestions)
    const foundAsNewDelayedOrIgnored = _.find(
      suggestions,
      (s: Suggestion) =>
        s.id === suggestion.id && (s.state === 'NEW' || s.state === 'IGNORED' || s.state === 'DECISION_DELAYED'),
    )
    if (foundAsNewDelayedOrIgnored) {
      // && suggestion.state === 'NEW') {
      if (foundAsNewDelayedOrIgnored.state === 'IGNORED') {
        //} && suggestion.type === 'RESTART') {
        console.log('setting existing restart suggestion to state NEW again')
        foundAsNewDelayedOrIgnored.state = 'NEW'
        this.db.put(this.STORE_IDENT, foundAsNewDelayedOrIgnored, foundAsNewDelayedOrIgnored.id)
        return Promise.resolve()
      }
      return Promise.reject(
        `there's already a suggestion in state ${foundAsNewDelayedOrIgnored.state}, not adding (now)`,
      )
    }
    const found = _.find(suggestions, (s: Suggestion) => s.url === suggestion.url)
    if (!found) {
      await this.db.add(this.STORE_IDENT, suggestion, suggestion.id)
      return Promise.resolve()
    }
    return Promise.reject(`suggestion already exists for url '${suggestion.url}'`)
  }

  removeSuggestion(id: string): Promise<any> {
    return this.db.delete(this.STORE_IDENT, id)
  }

  async setSuggestionState(suggestionId: string, state: SuggestionState): Promise<Suggestion> {
    console.log('setting suggestion to state', suggestionId, state)
    const s: Suggestion = await this.db.get(this.STORE_IDENT, suggestionId)
    if (s) {
      console.log('setting suggestion to state', suggestionId, state)
      s.state = state
      await this.db.put(this.STORE_IDENT, s, suggestionId)
      return Promise.resolve(s)
    }
    return Promise.reject('could not update suggestion')
  }

  async clearAll(): Promise<void> {
    return await this.db.clear(this.STORE_IDENT)
  }
}

export default new IndexedDbSuggestionsPersistence()
