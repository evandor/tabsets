import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { useLogger } from 'src/core/services/Logger'
import TabsetService from 'src/tabsets/services/TabsetService'

const { info } = useLogger()

export class ImportTabsetsCommand implements Command<string> {
  constructor(public json: string) {}

  async execute(): Promise<ExecutionResult<string>> {
    TabsetService.importData(this.json)
    info('imported tabsets')
    Analytics.fireEvent('tabset_imported', {})
    return Promise.resolve(new ExecutionResult('done', 'Tabsets were imported'))
  }
}

ImportTabsetsCommand.prototype.toString = function cmdToString() {
  return `ImportTabsetsCommand`
}
