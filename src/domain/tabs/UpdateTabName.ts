import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import TabsetService from 'src/tabsets/services/TabsetService'
import { Tab } from 'src/tabsets/models/Tab'
import { useSearchStore } from 'src/search/stores/searchStore'

class UndoCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public oldName: string,
  ) {}

  execute(): Promise<ExecutionResult<any>> {
    console.info(this.tab, `reverting changed tab name to ${this.oldName}`)
    return TabsetService.setCustomTitle(this.tab, this.oldName, '')
      .then((res) => {
        if (this.tab.url) {
          useSearchStore().update(this.tab.url, 'name', this.oldName)
        }
        return res
      })
      .then((res) => new ExecutionResult(res, "Tab's title change was undone"))
  }
}

export class UpdateTabNameCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public newName: string,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    const oldTitle = this.tab.name ? this.tab.name : this.tab.title || '?'
    return TabsetService.setCustomTitle(this.tab, this.newName, '')
      .then((ignored) => {
        console.log('custom title', this.tab)
        if (this.tab.url) {
          useSearchStore().update(this.tab.url, 'name', this.newName)
        }
      })
      .then((ignored) =>
        Promise.resolve(
          new ExecutionResult(
            this.newName,
            "Tab's title was edited",
            new Map([['Undo', new UndoCommand(this.tab, oldTitle)]]),
          ),
        ),
      )
      .catch((err) => Promise.reject(err))
  }
}

UpdateTabNameCommand.prototype.toString = function cmdToString() {
  return `UpdateTabNameCommand: {tabId=${this.tab.id}, newName=${this.newName}}`
}
