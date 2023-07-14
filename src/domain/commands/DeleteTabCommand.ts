import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";
import {useTabsetService} from "src/services/TabsetService2";

const {addToTabset, deleteTab} = useTabsetService()

class UndoCommand implements Command<any> {


  constructor(public tabset: Tabset, public tab: Tab) {
  }

  execute(): Promise<ExecutionResult<any>> {
    console.log("execution undo command", this.tab, this.tabset)
    return addToTabset(this.tabset, this.tab)
      .then((res) => new ExecutionResult(res, "Tab has been restored again"))
  }

}

export class DeleteTabCommand implements Command<Tabset> {

  constructor(public tab: Tab) {
  }

  async execute(): Promise<ExecutionResult<Tabset>> {
    return deleteTab(this.tab)
      .then(tabset => Promise.resolve(new ExecutionResult(
        tabset,
        "Tab was deleted",
        new UndoCommand(tabset, this.tab))))
      .catch(err => Promise.reject(err))
  }
}


DeleteTabCommand.prototype.toString = function cmdToString() {
  return `DeleteTabCommand: {tab.id=${this.tab.id}, tab.url=${this.tab.url}}`;
};
