import BrowserApi from 'src/app/BrowserApi'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useLogger } from 'src/core/services/Logger'
import { useUtils } from 'src/core/services/Utils'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { RestoreTabsetCommand } from 'src/tabsets/commands/RestoreTabset'
import { SaveOrReplaceResult } from 'src/tabsets/models/SaveOrReplaceResult'
import { TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'

const { sendMsg } = useUtils()
const { info } = useLogger()

export class CreateStashCommand implements Command<any> {
  public merge: boolean = true

  constructor(
    public sessionName: string,
    public collection?: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    try {
      const tabsToUse = useTabsStore2()
        .browserTabs.filter((chromeTab: chrome.tabs.Tab) => chromeTab.url !== undefined)
        .filter((chromeTab: chrome.tabs.Tab) => useTabsetsStore().tabsForUrl(chromeTab.url!).length === 0)

      if (tabsToUse.length === 0) {
        return Promise.resolve(new ExecutionResult('done', 'Empty Stash'))
      }

      return useCommandExecutor()
        .execute(new CreateTabsetCommand(this.sessionName, tabsToUse))
        .then((res: ExecutionResult<SaveOrReplaceResult>) => {
          console.log('res', res.result.tabset)
          const ts = res.result.tabset
          ts.type = TabsetType.SESSION
          useTabsetsStore().saveTabset(ts)
          BrowserApi.closeAllTabs(false)
        })
        .then(() => {
          const tabsetId = this.collection
          //useCommandExecutor().executeFromUi(new CreateTabsetCommand(callback['sessionName' as keyof object], []))
          if (tabsetId) {
            useTabsetService().selectTabset(tabsetId)
            useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId, undefined, false))
          }
        })
        .then(() => {
          return Promise.resolve(new ExecutionResult('done', 'Created new Stash with ' + tabsToUse.length + ' tabs'))
        })
    } catch (err) {
      return Promise.reject('could not create stash')
    }
  }
}

CreateStashCommand.prototype.toString = function cmdToString() {
  return `CreateStashCommand: {sessionName=${this.sessionName}, collection=${this.collection}}`
}
