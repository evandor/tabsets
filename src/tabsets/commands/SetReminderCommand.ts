import { date } from 'quasar'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const { sanitizeAsText } = useUtils()

export class SetReminderCommand implements Command<any> {
  constructor(
    public tabId: string,
    public reminderDate: string | undefined,
    public comment: string | undefined,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tabset = useTabsetsStore().getCurrentTabset
    if (!tabset) {
      return Promise.reject('could not get current tabset')
    }
    const tab: Tab = tabset.tabs.filter((t: Tab) => t.id === this.tabId)[0]!
    if (this.reminderDate) {
      const theDate = date.extractDate(this.reminderDate, 'YYYY/MM/DD')
      tab.reminder = new Date(theDate.getFullYear(), theDate.getMonth(), theDate.getDate()).getTime()
    } else {
      tab.reminder = undefined
    }
    tab.reminderComment = sanitizeAsText(this.comment ?? '')
    return useTabsetService()
      .saveTabset(tabset)
      .then(() => {
        Analytics.fireEvent('tabset_tab_reminder_set', {})
        return new ExecutionResult('done', 'Reminder set')
      })
  }
}

SetReminderCommand.prototype.toString = function cmdToString() {
  return `SetReminderCommand: {tabId=${this.tabId}, {reminderDate:${this.reminderDate}}`
}
