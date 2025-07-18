import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/core/services/Logger'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const { info } = useLogger()

function shareWith(tabsetId: string, email: string, readonly: boolean, sharedBy: string) {
  const tabset = useTabsetsStore().getTabset(tabsetId)!
  return useTabsetsStore().shareWith(tabset, email, readonly, sharedBy)
}

export class ShareWithTabsetCommand implements Command<any> {
  constructor(
    public tabsetId: string,
    public author: string,
    public email: string,
    public readonly: boolean = false,
    public republish: boolean = false,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const sharedBy = this.author
    return shareWith(this.tabsetId, this.email, this.readonly, sharedBy || 'unknown')
      .then((res: any) => {
        info('sharing tabset')
        return res
      })
      .then(
        (oldSharing) =>
          Promise.resolve(
            new ExecutionResult(
              oldSharing,
              this.republish ? 'The tabset has been republished' : 'The tabset is shared now.',
            ),
          ),
        //new UnShareTabsetCommand(this.tabsetId)))
      )
      .catch((err) => Promise.reject(err))
  }
}

ShareWithTabsetCommand.prototype.toString = function cmdToString() {
  return `ShareWithTabsetCommand: {tabsetId=${this.tabsetId}}, {author=${this.author}}`
}
