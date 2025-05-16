import { uid } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Page } from 'src/custompages/models/backend'
import { ContentBlock, ContentBlockType } from 'src/custompages/models/frontend'
import { usePagesStore } from 'src/custompages/stores/pagesStore'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class CreatePageCommand implements Command<Tab> {
  constructor() {}

  async execute(): Promise<ExecutionResult<Tab>> {
    try {
      const currentTs = useTabsetsStore().getCurrentTabset
      if (!currentTs) {
        return Promise.reject('no current tabset')
      }
      const tabId = uid()
      const pageTab = new Tab(
        tabId,
        BrowserApi.createChromeTabObject(
          'New Page',
          chrome.runtime.getURL('www/index.html#/mainpanel/pages/' + tabId),
          'sym_o_article',
        ),
      )
      currentTs.tabs.push(pageTab)
      await usePagesStore().updatePage(
        new Page(tabId, 'newPage', 1, new Date().getTime(), 0, 0, [
          new ContentBlock(uid(), ContentBlockType.ContentBlockHeading, 'Headline'),
        ]),
      )
      await useTabsetsStore().saveTabset(currentTs)
      return Promise.resolve(new ExecutionResult(pageTab, 'doneMsg'))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreatePageCommand.prototype.toString = function cmdToString() {
  return `CreatePageCommand: {}`
}
