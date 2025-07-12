import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useUtils } from 'src/core/services/Utils'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

const { sendMsg } = useUtils()

function setMatcher(tab: Tab, matcher: string | undefined): Promise<any> {
  tab.matcher = matcher
  return useTabsetService().saveCurrentTabset()
}

export class TabAssignmentCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public tabsetId: string,
    public matcher: string | undefined,
  ) {}

  async execute(): Promise<ExecutionResult<string | undefined>> {
    return setMatcher(this.tab, this.matcher)
      .then((ignored) => {
        sendMsg('reload-tabset', { tabsetId: this.tabsetId })
      })
      .then((ignored) => Promise.resolve(new ExecutionResult(this.matcher, "Tab's matcher was changed")))
      .catch((err) => Promise.reject(err))
  }
}

TabAssignmentCommand.prototype.toString = function cmdToString() {
  return `TabAssignmentCommand: {tabId=${this.tab.id}, {matcher=${this.matcher}}`
}
