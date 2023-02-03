
export enum SuggestionState {
  NEW = "NEW",
  IGNORED = "IGNORED"
}


export enum SuggestionType {
  RSS = "RSS",
  FEATURE = "FEATURE"
}

export class Suggestion {

  public state: SuggestionState;

  constructor(public id: string, public title: string, public msg: string, public url: string, public type: SuggestionType = SuggestionType.RSS) {
    this.state = SuggestionState.NEW
  }
}
