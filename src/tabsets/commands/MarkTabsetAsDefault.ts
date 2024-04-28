import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {TabsetStatus} from "src/tabsets/models/Tabset";
import {MarkTabsetAsFavoriteCommand} from "src/tabsets/commands/MarkTabsetAsFavorite";

class UndoCommand implements Command<TabsetStatus> {

  constructor(public tabsetId: string, public oldStatus: TabsetStatus) {
  }

  execute(): Promise<ExecutionResult<any>> {
    //logger.info("execution undo command", this.tabsetId)
    return new MarkTabsetAsFavoriteCommand(this.tabsetId).execute()
      .then(res => new ExecutionResult(res, "Tabset was reverted to favorite"))
  }

}

export class MarkTabsetAsDefaultCommand implements Command<TabsetStatus> {

  constructor(
    public tabsetId: string)
  {}

  async execute(): Promise<ExecutionResult<TabsetStatus>> {
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
