import AppEventDispatcher from 'src/app/AppEventDispatcher'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/core/services/Logger'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { SpecialTabsetId, Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const { sendMsg } = useUtils()
const { info } = useLogger()

export class CreateSpecialTabsetCommand implements Command<Tabset> {
  constructor(
    public tabsetId: SpecialTabsetId,
    public icon: string = 'sym_o_list',
  ) {}

  async execute(): Promise<ExecutionResult<Tabset>> {
    const tabset = await useTabsetsStore().createSpecialTabset(this.tabsetId)
    tabset.icon = this.icon
    if (tabset) {
      await useTabsetService().saveTabset(tabset)
      Analytics.fireEvent('tabset_created', { tabsCount: 0 })
      info('tabset created')
      sendMsg('tabset-added', { tabsetId: tabset.id })
      localStorage.setItem('test.tabsetId', tabset.id)
      AppEventDispatcher.dispatchEvent('run-metrics')
    }

    const executionResult = new ExecutionResult(tabset, '(Special) Tabset was created')
    return Promise.resolve(executionResult)
  }
}

CreateSpecialTabsetCommand.prototype.toString = function cmdToString() {
  return `CreateSpecialTabsetCommand: {tabsetId=${this.tabsetId}}`
}
