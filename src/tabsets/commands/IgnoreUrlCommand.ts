import { uid } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class IgnoreUrlCommand implements Command<any> {
  constructor(public url: string) {}

  execute(): Promise<ExecutionResult<any>> {
    let ignoredTabset = useTabsetsStore().getTabset('IGNORED')
    if (!ignoredTabset) {
      console.log('creating special tabset IGNORED as it does not exist yet')
      ignoredTabset = new Tabset('IGNORED', 'ignored tabs', [])
      ignoredTabset.type = TabsetType.SPECIAL
      useTabsetsStore().addTabset(ignoredTabset)
    }
    try {
      const url = new URL(this.url)
      const normalizedUrl = url.protocol + '//' + url.hostname + url.pathname
      if (ignoredTabset.tabs.map((t: Tab) => t.url).indexOf(normalizedUrl) < 0) {
        console.log('ignoring url', normalizedUrl)
        const tab = new Tab(uid(), BrowserApi.createChromeTabObject(normalizedUrl, normalizedUrl))
        ignoredTabset.tabs.push(tab)
        useTabsetsStore().saveTabset(ignoredTabset)
      }
      return Promise.resolve(new ExecutionResult('', 'done'))
    } catch (err) {
      return Promise.reject('could not parse URL')
    }
  }
}

IgnoreUrlCommand.prototype.toString = function cmdToString() {
  return `IgnoreUrlCommand: {tabId=${this.url}}`
}
