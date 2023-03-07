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
      .setImage('o_bookmarks')
  ]

  constructor(public id: string, public title: string, public msg: string, public url: string, public type: SuggestionType = SuggestionType.RSS) {
    this.state = SuggestionState.NEW
  }

  setImage(img: string): Suggestion {
    this.img = img
    return this
  }

  static getStaticSuggestion(ident: StaticSuggestionIdent): Suggestion | undefined {
    return _.find(this.staticSuggestions, s => s.id === ident)
  }
}
