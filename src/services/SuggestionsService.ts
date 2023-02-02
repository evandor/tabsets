// import {Suggestion, SuggestionState} from "src/models/Suggestion";
// import {useDB} from "src/services/usePersistenceService";
// import {useSuggestionsStore} from "stores/suggestionsStore";
//
// const {localDb} = useDB()
//
// class SuggestionsService {
//
//   async init() {
//     console.debug("initializing SuggestionsService")
//     useSuggestionsStore().init()
//   }
//
//   // const addSuggestion = (suggestion: Suggestion) => {
//   //   // TODO: check ignore list, already existing
//   //   localDb.addSuggestion(suggestion)
//   // }
//   //
//   getSuggestions() {
//     return useSuggestionsStore().getSuggestions()
//   }
//
//
//   ignoreSuggestion = (id: string) => useSuggestionsStore().ignoreSuggestion(id)
//   applySuggestion = (id: string) => {
//     useSuggestionsStore().ignoreSuggestion(id)
//   }
//
//   addSuggestion(suggestion: Suggestion) {
//     useSuggestionsStore().addSuggestion(suggestion)
//   }
//
//
// }
//
// export default new SuggestionsService();
//
