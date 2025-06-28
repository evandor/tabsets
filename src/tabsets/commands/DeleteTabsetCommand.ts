import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { useLogger } from 'src/core/services/Logger'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'

const { info } = useLogger()

export class DeleteTabsetCommand implements Command<string> {
  constructor(public tabsetId: string) {}

  async execute(): Promise<ExecutionResult<string>> {
    return useTabsetService()
      .deleteTabset(this.tabsetId)
      .then((res) => {
        //sendMsg('tabset-deleted', {tabsetId: this.tabsetId})
        Analytics.fireEvent('tabset_deleted', {})
        useTabsetsUiStore().clearFromLastUsedTabsets(useSpacesStore().space?.id || undefined, this.tabsetId)
        info('tabset deleted')
        return res
      })
      .then((res) => Promise.resolve(new ExecutionResult(res, 'Tabset deleted')))
      .catch((err) => Promise.reject(err))
  }
}

DeleteTabsetCommand.prototype.toString = function cmdToString() {
  return `DeleteTabsetCommand: {tabsetId=${this.tabsetId}}`
}
