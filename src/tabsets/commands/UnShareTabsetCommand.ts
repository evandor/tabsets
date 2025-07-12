import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/core/services/Logger'
import { TabsetSharing } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const { info } = useLogger()

function share(tabsetId: string, sharing: TabsetSharing, sharedId: string | undefined, sharedBy: string) {
  const tabset = useTabsetsStore().getTabset(tabsetId)!
  return useTabsetsStore().share(tabset, sharing, sharedId, sharedBy)
}

export class UnShareTabsetCommand implements Command<any> {
  constructor(
    public tabsetId: string,
    public sharedId: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    return share(this.tabsetId, TabsetSharing.UNSHARED, this.sharedId, 'undefined')
      .then((res: any) => {
        info('unsharing tabset')
        return res
      })
      .then((oldSharing: any) => Promise.resolve(new ExecutionResult(oldSharing, 'The tabset not shared anymore')))
      .catch((err: any) => Promise.reject(err))
  }
}

UnShareTabsetCommand.prototype.toString = function cmdToString() {
  return `UnShareTabsetCommand: {tabsetId=${this.tabsetId}}`
}
