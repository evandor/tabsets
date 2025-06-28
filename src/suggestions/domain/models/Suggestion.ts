import _ from 'lodash'

export type SuggestionState =
  | 'NEW'
  | 'IGNORED'
  | 'APPLIED'
  | 'CHECKED'
  | 'DECISION_DELAYED'
  | 'INACTIVE'
  | 'NOTIFICATION'

export type SuggestionType =
  | 'RSS'
  // | 'REDIRECT_HAPPENED_FOR_TAB'
  // | 'REDIRECT_HAPPENED_FOR_BOOKMARK'
  // | 'CONTENT_CHANGE'
  | 'USE_EXTENSION' // pro only
  // | 'RESTART'
  // suggest a not-yet-used feature
  | 'FEATURE'
  | 'URL'
  | 'TABSET_SHARED' // suggest accepting a shared tabset

  // suggest switching tabset to a better matching one. Refers to a window and will be deleted when a new
  // suggestion is about to be added.
  | 'SWITCH_TABSET'

export type StaticSuggestionIdent =
  | 'TRY_TAB_DETAILS_FEATURE'
  | 'TRY_BOOKMARKS_FEATURE'
  | 'TRY_OPENTABS_FEATURE'
  | 'TRY_SPACES_FEATURE'
  | 'TRY_NEWEST_TABS_FEATURE'
  | 'RELEASE_NOTES_AVAILABLE'
  | 'RESTART_SUGGESTED'
  | 'USE_EXTENSION_SUGGESTION'
  | 'SWITCH_TABSET'

export class Suggestion {
  public state: SuggestionState
  public img: string | undefined = undefined
  public data: object = {}
  public created: number | undefined = undefined
  public applyLabel: string = 'Yes'
  public windowId: number | undefined = undefined

  static staticSuggestions: Suggestion[] = [
    new Suggestion(
      'TRY_BOOKMARKS_FEATURE',
      'Want to try a new feature?',
      "Maybe you want to try the optional 'Bookmarks' feature?",
      '/features/bookmarks',
      'FEATURE',
    ).setImage('o_bookmarks'),
    new Suggestion(
      'TRY_SPACES_FEATURE',
      'Want to try a new feature?',
      "Check out the optional 'Spaces' feature and get another level of organization",
      '/features/spaces',
      'FEATURE',
    ).setImage('o_space_dashboard'),
    new Suggestion(
      'TRY_OPENTABS_FEATURE',
      'Want to try a new feature?',
      "Check out the optional 'Open Tabs' feature and manage your browser tabs in the sidepanel",
      '/features/open_tabs',
      'FEATURE',
    ).setImage('o_playlist_add'),
    new Suggestion(
      'TRY_NEWEST_TABS_FEATURE',
      'Want to try a new feature?',
      'Activate a view with your latest tabs',
      '/features/newest_tabs',
      'FEATURE',
    ).setImage('o_schedule'),
    // new Suggestion(StaticSuggestionIdent.RELEASE_NOTES_AVAILABLE,
    //   "Version was updated",
    //   "Do you want to read the release notes?",
    //   RELEASE_NOTES_URL,
    //   SuggestionType.URL)
    //   .setImage('o_schedule'),
    // new Suggestion(
    //   'RESTART_SUGGESTED',
    //   'Restart Required',
    //   'Please restart tabsets by clicking the button',
    //   '',
    //   'RESTART',
    // ).setImage('o_schedule'),
    new Suggestion(
      'USE_EXTENSION_SUGGESTION',
      'Check out Tabsets Extension',
      'Tabsets Browser Extension will provide many more features and integrations',
      'https://docs.tabsets.net',
      'URL',
    ).setImage('o_extension'),
  ]

  constructor(
    public id: string, // could be random, could be an encoded URL or a predefined string ("TRY Feature X")
    public title: string,
    public msg: string,
    public url: string,
    public type: SuggestionType = 'RSS',
  ) {
    this.state = 'NEW'
    this.created = new Date().getTime()
  }

  setImage(img: string): Suggestion {
    this.img = img
    return this
  }

  setState(state: SuggestionState): Suggestion {
    this.state = state
    return this
  }

  setWindowId(windowId: number): Suggestion {
    this.windowId = windowId
    return this
  }

  static getStaticSuggestion(ident: StaticSuggestionIdent): Suggestion | undefined {
    return _.find(this.staticSuggestions, (s: any) => s.id === ident)
  }
}
