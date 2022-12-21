import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";
import TabService from "src/services/TabService";
import {Tabset} from "src/models/Tabset";

class UndoCommand implements Command {


  constructor(public tabset: Tabset, public tab: Tab) {
  }

  execute(): Promise<ExecutionResult> {
    console.log("execution undo command", this.tab, this.tabset)
    return TabsetService.saveToTabset(this.tabset, this.tab)
      .then((res) => new ExecutionResult(res, "Tab has been restored again"))
  }

}

export class DeleteTabCommand implements Command {

  constructor(public tab: Tab) {
  }

  async execute(logger: any): Promise<ExecutionResult> {
    return TabService.delete(this.tab)
      .then(tabset => Promise.resolve(new ExecutionResult(
        tabset,
        "Tab was deleted",
        new UndoCommand(tabset, this.tab))))
      .catch(err => Promise.reject(err))
  }
}
