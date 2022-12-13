import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {MarkTabsetAsDefaultCommand} from "src/domain/commands/MarkTabsetAsDefaultCommand";

class UndoCommand implements Command {

  constructor(public tabsetId: string) {
  }

  execute(logger: any): Promise<ExecutionResult> {
    console.log("execution undo command", this.tabsetId)
    return new MarkTabsetAsDefaultCommand(this.tabsetId).execute(logger)
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was restored again")))
  }

}

export class MarkTabsetDeletedCommand implements Command {

  constructor(
    public tabsetId: string) {
  }

  async execute(logger: any): Promise<ExecutionResult> {
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
