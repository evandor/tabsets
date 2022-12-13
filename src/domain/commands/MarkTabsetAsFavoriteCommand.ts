import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {TabsetStatus} from "src/models/Tabset";
import {DeleteTabsetCommand} from "src/domain/commands/DeleteTabsetCommand";
import {MarkTabsetAsDefaultCommand} from "src/domain/commands/MarkTabsetAsDefaultCommand";

class UndoCommand implements Command {

  constructor(public tabsetId: string, public oldStatus: TabsetStatus) {
  }

  execute(logger: any): Promise<ExecutionResult> {
    return new MarkTabsetAsDefaultCommand(this.tabsetId).execute(logger)
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was unmarked again")))
  }

}

export class MarkTabsetAsFavoriteCommand implements Command {

  constructor(
    public tabsetId: string)
  {}

  async execute(logger: any): Promise<ExecutionResult> {
    return TabsetService.markAs(this.tabsetId, TabsetStatus.FAVORITE)
      .then(oldStatus => Promise.resolve(
        new ExecutionResult(
          oldStatus,
          "Tabset was marked as favorite",
          new UndoCommand(this.tabsetId, oldStatus)))
      )
      .catch(err => Promise.reject(err))
  }


}
