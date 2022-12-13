import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {TabsetStatus} from "src/models/Tabset";
import {DeleteTabsetCommand} from "src/domain/commands/DeleteTabsetCommand";
import {MarkTabsetAsFavoriteCommand} from "src/domain/commands/MarkTabsetAsFavoriteCommand";

class UndoCommand implements Command {

  constructor(public tabsetId: string, public oldStatus: TabsetStatus) {
  }

  execute(logger:any): Promise<ExecutionResult> {
    logger.info("execution undo command", this.tabsetId)
    return new MarkTabsetAsFavoriteCommand(this.tabsetId).execute(logger)
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was reverted to favorite")))
  }

}

export class MarkTabsetAsDefaultCommand implements Command {

  constructor(
    public tabsetId: string)
  {}

  async execute(logger: any): Promise<ExecutionResult> {
    return TabsetService.markAs(this.tabsetId, TabsetStatus.DEFAULT)
      .then(oldStatus => Promise.resolve(
        new ExecutionResult(
          oldStatus,
          "Tabset was unmarked as favorite",
          new UndoCommand(this.tabsetId, oldStatus)))
      )
      .catch(err => Promise.reject(err))
  }


}
