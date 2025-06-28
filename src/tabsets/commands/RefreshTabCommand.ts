import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

/**
 * the user might have been asked if she wanted to refresh a tab.
 */
export class RefreshTabCommand implements Command<string> {
  constructor(
    public tabId: number,
    public url: string,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    try {
      await chrome.tabs.reload(this.tabId)
      // the reload command does not seem to trigger any events, so we do this manually:
      useTabsetService().urlWasActivated(this.url)
      return new ExecutionResult<string>('done', 'reloaded tab')
    } catch (err: any) {
      return Promise.reject('could not refresh tab')
    }
  }
}

RefreshTabCommand.prototype.toString = function cmdToString() {
  return `RefreshTabCommand: {tab=${this.tabId.toString()}}`
}
