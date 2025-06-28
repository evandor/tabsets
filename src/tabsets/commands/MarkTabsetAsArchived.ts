import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { MarkTabsetAsDefaultCommand } from 'src/tabsets/commands/MarkTabsetAsDefault'
import { MarkTabsetAsFavoriteCommand } from 'src/tabsets/commands/MarkTabsetAsFavorite'
import { TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

class UndoCommand implements Command<any> {
  constructor(
    public tabsetId: string,
    public oldStatus: TabsetStatus,
  ) {}

  execute(): Promise<ExecutionResult<any>> {
    console.log('execution undo command', this.tabsetId)
    switch (this.oldStatus) {
      case TabsetStatus.DEFAULT:
        return new MarkTabsetAsDefaultCommand(this.tabsetId)
          .execute()
          .then((res) => Promise.resolve(new ExecutionResult(res, 'Tabset was un-archived again')))
      case TabsetStatus.FAVORITE:
        return new MarkTabsetAsFavoriteCommand(this.tabsetId)
          .execute()
          .then((res) => Promise.resolve(new ExecutionResult(res, 'Tabset was un-archived again')))
      default:
        return Promise.reject('could not deal with status ' + this.oldStatus)
    }
  }
}

export class MarkTabsetAsArchivedCommand implements Command<any> {
  constructor(public tabsetId: string) {}

  async execute(): Promise<ExecutionResult<any>> {
    return useTabsetService()
      .markAs(this.tabsetId, TabsetStatus.ARCHIVED)
      .then((oldStatus) =>
        Promise.resolve(
          new ExecutionResult(
            oldStatus,
            'The tabset has been archived. Check the settings page to revert this decision',
            new Map([['Undo', new UndoCommand(this.tabsetId, oldStatus)]]),
          ),
        ),
      )
      .catch((err) => Promise.reject(err))
  }
}
