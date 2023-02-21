import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {MarkTabsetAsDefaultCommand} from "src/domain/tabsets/MarkTabsetAsDefault";

class UndoCommand implements Command<any> {

  constructor(public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult<any>> {
    console.log("execution undo command", this.tabsetId)
    return new MarkTabsetAsDefaultCommand(this.tabsetId).execute()
      .then(res => new ExecutionResult(res, "Tabset was restored again"))
  }

}

export class MarkTabsetDeletedCommand implements Command<boolean> {

  constructor(
    public tabsetId: string) {
  }

  async execute(): Promise<ExecutionResult<boolean>> {
    return TabsetService.markAsDeleted(this.tabsetId)
      .then(res => Promise.resolve(
        new ExecutionResult(
          res,
          "Tabset was deleted",
          new UndoCommand(this.tabsetId)))
      )
      .catch(err => Promise.reject(err))
  }


}

MarkTabsetDeletedCommand.prototype.toString = function cmdToString() {
  return `MarkTabsetDeletedCommand: {tabsetId=${this.tabsetId}}`;
};
