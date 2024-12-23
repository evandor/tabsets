import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import TabsetService from 'src/tabsets/services/TabsetService'
import { Tab } from 'src/tabsets/models/Tab'

export class UpdateTabColorCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public newColor: string | undefined,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    if (!this.newColor) {
      return Promise.reject('no color given')
    }
    return TabsetService.setColor(this.tab, this.newColor)
      .then((ignored) =>
        Promise.resolve(new ExecutionResult(this.newColor!, "Tab's color was changed")),
      )
      .catch((err) => Promise.reject(err))
  }
}

UpdateTabColorCommand.prototype.toString = function cmdToString() {
  return `UpdateTabColorCommand: {tabId=${this.tab.id}, {color=${this.newColor}}`
}
