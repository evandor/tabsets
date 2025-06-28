import { Suggestion, SuggestionState } from 'src/suggestions/domain/models/Suggestion'

export function useSuggestionsService() {
  const hasSuggestionsInState = (suggestions: Suggestion[], states: SuggestionState[]): boolean => {
    return (
      suggestions.filter(
        (s: Suggestion) => states.findIndex((searchedState: SuggestionState) => searchedState === s.state) >= 0,
      ).length > 0
    )
  }
  const suggestionsInsState = (suggestions: Suggestion[], states: SuggestionState[]): Suggestion[] => {
    console.log('suggestionsInsState', suggestions, states)
    return suggestions.filter(
      (s: Suggestion) => states.findIndex((searchedState: SuggestionState) => searchedState === s.state) >= 0,
    )
  }
  return {
    hasSuggestionsInState,
    suggestionsInsState,
  }
}
