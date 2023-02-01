
export enum SuggestionState {
  NEW = "NEW",
  IGNORED = "IGNORED"
}

export class Suggestion {

  public state: SuggestionState;

  constructor(public id: string, public title: string, public msg: string, public url: string) {
    this.state = SuggestionState.NEW
  }
}
