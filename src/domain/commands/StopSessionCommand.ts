import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {MarkTabsetAsFavoriteCommand} from "src/domain/commands/MarkTabsetAsFavoriteCommand";
import {MarkTabsetAsDefaultCommand} from "src/domain/commands/MarkTabsetAsDefaultCommand";
import {CreateTabsetCommand} from "src/domain/commands/CreateTabsetCommand";
import {useTabsetService} from "src/services/TabsetService2";

class UndoCommand implements Command {

  constructor(public tabset: Tabset) {
  }

  execute(): Promise<ExecutionResult<any>> {
    console.log("execution undo command", this.tabset.id)
    this.tabset.type = TabsetType.DEFAULT
    useTabsetService().saveTabset(this.tabset)
    return Promise.resolve(new ExecutionResult(null, "Tabset is used for auto-tracking again"))
  }

}

export class StopSessionCommand implements Command {

  constructor(
    public tabset: Tabset) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    this.tabset.type = TabsetType.DEFAULT
    const res = await useTabsetService().saveTabset(this.tabset)
    return Promise.resolve(
      new ExecutionResult(
        null,
        "The session has been stopped. New Tabs are not added automatically.",
        new UndoCommand(this.tabset)))
  }
}

StopSessionCommand.prototype.toString = function cmdToString() {
  return `StopSessionCommand: {tabset=${this.tabset.id}}`
};
