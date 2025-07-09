import Persistence from 'src/core/persistence/Persistence'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import { Suggestion, SuggestionState } from 'src/suggestions/domain/models/Suggestion'

abstract class SuggestionsPersistence implements Persistence {
  getServiceName(): string {
    return this.constructor.name
  }

  abstract init(firebaseServices: IFirebaseServices): Promise<any>

  abstract getSuggestions(): Promise<Suggestion[]>
  abstract addSuggestion(suggestion: Suggestion): Promise<void>
  abstract removeSuggestion(ident: string): Promise<any>
  abstract setSuggestionState(suggestionId: string, state: SuggestionState): Promise<Suggestion>
  abstract clearAll(): Promise<void>

  compactDb(): Promise<any> {
    return Promise.resolve('noOp')
  }
}

export default SuggestionsPersistence
