import _ from "lodash"

export enum SuggestionState {
  NEW = "NEW",
  IGNORED = "IGNORED",
  APPLIED = "APPLIED",
  CANCELED = "CANCELED",
}


export enum SuggestionType {
  RSS = "RSS",

  CONTENT_CHANGE = "CONTENT_CHANGE",
  FEATURE = "FEATURE"
}

export enum StaticSuggestionIdent {
  TRY_TAB_DETAILS_FEATURE = "TRY_TAB_DETAILS_FEATURE",
  TRY_BOOKMARKS_FEATURE = "TRY_BOOKMARKS_FEATURE",
  TRY_SPACES_FEATURE = "TRY_SPACES_FEATURE",
  TRY_NEWEST_TABS_FEATURE = "TRY_NEWEST_TABS_FEATURE",
}

export class Suggestion {

  public state: SuggestionState;
  public img: string | undefined = undefined;

  static staticSuggestions: Suggestion[] = [
    new Suggestion(StaticSuggestionIdent.TRY_TAB_DETAILS_FEATURE.toString(),
      "Want to try a new feature?",
      "Maybe you want to try the optional 'Display Tab Details' feature?",
      "/features/details",
      SuggestionType.FEATURE)
      .setImage('o_info'),
    new Suggestion(StaticSuggestionIdent.TRY_BOOKMARKS_FEATURE,
      "Want to try a new feature?",
      "Maybe you want to try the optional 'Bookmarks' feature?",
      "/features/bookmarks",
      SuggestionType.FEATURE)
      .setImage('o_bookmarks'),
    new Suggestion(StaticSuggestionIdent.TRY_SPACES_FEATURE,
      "Want to try a new feature?",
      "Check out the optional 'Spaces' feature and get another level of organization",
      "/features/spaces",
      SuggestionType.FEATURE)
      .setImage('o_space_dashboard'),
    new Suggestion(StaticSuggestionIdent.TRY_NEWEST_TABS_FEATURE,
        "Want to try a new feature?",
        "Click here to check it out",
        "/features/newest_tabs",
        SuggestionType.FEATURE)
        .setImage('o_schedule')
  ]

  constructor(public id: string, public title: string, public msg: string, public url: string, public type: SuggestionType = SuggestionType.RSS) {
    this.state = SuggestionState.NEW
  }

  setImage(img: string): Suggestion {
    this.img = img
    return this
  }

  static getStaticSuggestion(ident: StaticSuggestionIdent): Suggestion | undefined {
    console.log("hier", this.staticSuggestions, ident)
    return _.find(this.staticSuggestions, s => s.id === ident)
  }
}
