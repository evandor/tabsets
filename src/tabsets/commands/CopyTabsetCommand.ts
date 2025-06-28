import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { DeleteTabsetCommand } from 'src/tabsets/commands/DeleteTabsetCommand'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

class UndoCopyTabsetCommand implements Command<object> {
  constructor(public tabsetId: string) {}

  execute(): Promise<ExecutionResult<object>> {
    return new DeleteTabsetCommand(this.tabsetId)
      .execute()
      .then((res) => Promise.resolve(new ExecutionResult(res, 'Tabset was deleted again')))
  }
}

export class CopyTabsetCommand implements Command<object> {
  constructor(public tabset: Tabset) {}

  async execute(): Promise<ExecutionResult<object>> {
    try {
      const result = await useTabsetService().copyFromTabset(this.tabset)
      Analytics.fireEvent('tabset_copied', {})
      return Promise.resolve(
        new ExecutionResult(
          result,
          'Tabset has been copied',
          new Map([['Undo', new UndoCopyTabsetCommand(result['tabset' as keyof object]['id'])]]),
        ),
      )
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CopyTabsetCommand.prototype.toString = function cmdToString() {
  return `CopyTabsetCommand: tabsetName=${this.tabset.name}, tabs#=${this.tabset.tabs.length}}`
}
