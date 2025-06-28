import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'

const { inBexMode, sendMsg } = useUtils()

export class SelectTabsetCommand implements Command<Tabset | undefined> {
  public merge: boolean = true

  constructor(
    public tabsetId: string,
    public folderId?: string,
  ) {}

  async execute(): Promise<ExecutionResult<Tabset | undefined>> {
    useTabsetService().selectTabset(this.tabsetId)
    const tabset = useTabsetsStore().getCurrentTabset
    if (tabset && this.folderId) {
      tabset.folderActive = this.folderId
      await useTabsetsStore().saveTabset(tabset)
      useTabsetsUiStore().updateExtensionIcon()
    }

    if (inBexMode()) {
      const data = {
        ignore: true, // doing this to keep the logic, might be needed again
        data: { tabsetId: this.tabsetId },
      }
      if (tabset && tabset.type === TabsetType.DEFAULT) {
        useTabsetsUiStore().addTabsetToLastUsedList(this.tabsetId)
      }
    }

    Analytics.fireEvent('tabset_selected', {})
    const executionResult = new ExecutionResult(tabset, 'done')
    return Promise.resolve(executionResult)
  }
}

SelectTabsetCommand.prototype.toString = function cmdToString() {
  return `SelectTabsetCommand: {tabsetId=${this.tabsetId}}`
}
