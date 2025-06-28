import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { MarkTabsetAsFavoriteCommand } from 'src/tabsets/commands/MarkTabsetAsFavorite'
import { TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

//import TabsetService from 'src/tabsets/services/TabsetService'

class UndoCommand implements Command<TabsetStatus> {
  constructor(
    public tabsetId: string,
    public oldStatus: TabsetStatus,
  ) {}

  execute(): Promise<ExecutionResult<any>> {
    //logger.info("execution undo command", this.tabsetId)
    return new MarkTabsetAsFavoriteCommand(this.tabsetId)
      .execute()
      .then((res) => new ExecutionResult(res, 'Tabset was reverted to favorite'))
  }
}

export class MarkTabsetAsDefaultCommand implements Command<TabsetStatus> {
  constructor(public tabsetId: string) {}

  async execute(): Promise<ExecutionResult<TabsetStatus>> {
    return useTabsetService()
      .markAs(this.tabsetId, TabsetStatus.DEFAULT)
      .then((oldStatus) =>
        Promise.resolve(
          new ExecutionResult(
            oldStatus,
            'unmarked as favorite',
            //new Map([["Undo", new UndoCommand(this.tabsetId, oldStatus)]]))
          ),
        ),
      )
      .catch((err) => Promise.reject(err))
  }
}
