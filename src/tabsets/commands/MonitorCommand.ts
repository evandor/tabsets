import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import Analytics from 'src/core/utils/google-analytics'
import { SaveMHtmlCommand } from 'src/snapshots/commands/SaveMHtmlCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { MonitoredTab } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class MonitorCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public createSnapshot: boolean,
    public setActive: boolean,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tabset = useTabsetsStore().getCurrentTabset
    if (!tabset || this.tab.id === null) {
      return Promise.reject('could not get current tabset')
    }
    if (!tabset.monitoredTabs) {
      tabset.monitoredTabs = []
    }
    if (this.setActive) {
      tabset.monitoredTabs.push({ tabId: this.tab.id })
      tabset.monitoredTabs = [...new Set(tabset.monitoredTabs)]

      if (this.createSnapshot && this.tab.url) {
        await useCommandExecutor().executeFromUi(new SaveMHtmlCommand(this.tab.id, this.tab.url))
      }
    } else {
      tabset.monitoredTabs = tabset.monitoredTabs.filter((mt: MonitoredTab) => mt.tabId !== this.tab.url)
    }
    return useTabsetService()
      .saveTabset(tabset)
      .then(() => {
        Analytics.fireEvent('tabset_tab_monitor_started', {})
        return new ExecutionResult('done', this.setActive ? 'tab is being monitored now' : 'Monitoring of tab stopped')
      })
  }
}

MonitorCommand.prototype.toString = function cmdToString() {
  return `MonitorCommand: {tabId=${this.tab.id}, tabUrl=${this.tab.url}, snapshot=${this.createSnapshot}, active=${this.setActive}}`
}
