import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import TabsetService from 'src/tabsets/services/TabsetService'

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
      .then((ignored) => {
        Analytics.fireEvent('tabset_tab_color_updated', {})
        return Promise.resolve(new ExecutionResult(this.newColor!, "Tab's color was changed"))
      })
      .catch((err) => Promise.reject(err))
  }
}

UpdateTabColorCommand.prototype.toString = function cmdToString() {
  return `UpdateTabColorCommand: {tabId=${this.tab.id}, {color=${this.newColor}}`
}
