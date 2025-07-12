import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

function toggleSorting(tabsetId: string): string | undefined {
  const tabset = useTabsetsStore().getTabset(tabsetId)
  if (tabset) {
    switch (tabset.sorting) {
      case 'custom':
        tabset.sorting = 'alphabeticalUrl'
        break
      case 'alphabeticalUrl':
        tabset.sorting = 'alphabeticalTitle'
        break
      case 'alphabeticalTitle':
        tabset.sorting = 'custom'
        break
      default:
        tabset.sorting = 'custom'
    }
    useTabsetService().saveTabset(tabset)
    return tabset.sorting
  }
  return undefined
}

export class ToggleSortingCommand implements Command<string> {
  constructor(public tabsetId: string) {}

  async execute(): Promise<ExecutionResult<string>> {
    const newSorting = toggleSorting(this.tabsetId)
    let msg = 'undefined'
    if (newSorting) {
      switch (newSorting) {
        case 'custom':
          msg = 'Sorting set to custom'
          break
        case 'alphabeticalUrl':
          msg = 'Sorting by URL'
          break
        case 'alphabeticalTitle':
          msg = 'Sorting by Title'
          break
        default:
          msg = 'Undefined sorting'
      }
      return Promise.resolve(new ExecutionResult(newSorting, msg))
    }
    return Promise.reject('sorting was undefined')
  }
}

ToggleSortingCommand.prototype.toString = function cmdToString() {
  return `ToggleSortingCommand: {tabsetId=${this.tabsetId}}`
}
