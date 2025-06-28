import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useOpenTabsStore } from 'src/opentabs/stores/openTabsStore'

export class TabsSortingCommand implements Command<string> {
  private tabsMap: Map<number, { index: number; url: string }> = new Map()

  constructor(public sortByUrl: boolean) {}

  async execute(): Promise<ExecutionResult<string>> {
    if (this.sortByUrl) {
      const currentTabs = await chrome.tabs.query({})
      this.tabsMap = new Map(
        currentTabs
          .filter((obj) => obj.id !== undefined && obj.url !== undefined)
          .map((obj) => [obj.id!, { index: obj.index, url: obj.url! }]),
      )
      useOpenTabsStore().setTabsMap(this.tabsMap)
      const sortedMap = new Map([...this.tabsMap.entries()].sort((a, b) => a[1].url?.localeCompare(b[1].url)))
      await chrome.tabs.move(Array.from(sortedMap.keys()), { index: -1 })
      return Promise.resolve(
        new ExecutionResult('', 'tabs sorted by URL', new Map([['Undo', new TabsSortingCommand(!this.sortByUrl)]])),
      )
    }
    const tabsMap = useOpenTabsStore().getTabsMap
    await chrome.tabs.move(Array.from(tabsMap.keys()), { index: -1 })
    return Promise.resolve(new ExecutionResult('', 'tabs with custom sorting'))
  }
}

TabsSortingCommand.prototype.toString = function cmdToString() {
  return `TabsSortingCommand: {sortByUrl=${this.sortByUrl}}`
}
