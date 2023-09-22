import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";
import {useSearchStore} from "src/stores/searchStore";

export class TabAssignmentCommand implements Command<any> {

  constructor(
    public tab: Tab,
    public matcher: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    return TabsetService.setMatcher(this.tab, this.matcher)
      .then(ignored => Promise.resolve(
        new ExecutionResult(
          this.matcher,
          "Tab's matcher was changed",
          ))
      )
      .catch(err => Promise.reject(err))
  }

}

TabAssignmentCommand.prototype.toString = function cmdToString() {
  return `TabAssignmentCommand: {tabId=${this.tab.id}, {matcher=${this.matcher}}`;
};
