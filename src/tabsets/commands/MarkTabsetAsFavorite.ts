import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {TabsetStatus} from "src/tabsets/models/Tabset";
import {MarkTabsetAsDefaultCommand} from "src/tabsets/commands/MarkTabsetAsDefault";

class UndoCommand implements Command<TabsetStatus> {

  constructor(public tabsetId: string, public oldStatus: TabsetStatus) {
  }

  execute(): Promise<ExecutionResult<any>> {
    return new MarkTabsetAsDefaultCommand(this.tabsetId).execute()
      .then(res => new ExecutionResult(res, "Tabset was unmarked again"))
  }

}

export class MarkTabsetAsFavoriteCommand implements Command<TabsetStatus> {

  constructor(
    public tabsetId: string)
  {}

  async execute(): Promise<ExecutionResult<TabsetStatus>> {
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
