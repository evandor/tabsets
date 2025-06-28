import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

class UndoCommand implements Command<TabsetStatus> {
  constructor(
    public tabsetId: string,
    public tabsetPage: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tabset = useTabsetsStore().getTabset(this.tabsetId)
    if (tabset) {
      tabset.page = this.tabsetPage
      const res = await useTabsetService().saveTabset(tabset)
      return new ExecutionResult(res, 'Description was reverted')
    }
    return Promise.reject('could not get tabset id')
  }
}

export class DeleteTabsetDescriptionCommand implements Command<string> {
  constructor(
    public tabsetId: string,
    public tabsetPage: string,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    return useTabsetService()
      .deleteTabsetDescription(this.tabsetId)
      .then((res) => {
        //sendMsg('...', {tabsetId: this.tabsetId})
        return res
      })
      .then((res) =>
        Promise.resolve(
          new ExecutionResult(
            res,
            'Description deleted',
            new Map([['Undo', new UndoCommand(this.tabsetId, this.tabsetId)]]),
          ),
        ),
      )
      .catch((err) => Promise.reject(err))
  }
}

DeleteTabsetDescriptionCommand.prototype.toString = function cmdToString() {
  return `DeleteTabsetDescriptionCommand: {tabsetId=${this.tabsetId}}`
}
