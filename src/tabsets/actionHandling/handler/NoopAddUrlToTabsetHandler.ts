import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import {
  AddUrlToTabsetHandlerAdditionalData,
  ComponentWithContext,
  TabActionMatcher,
} from 'src/tabsets/actionHandling/TabActionMatcher'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'

export class NoopAddUrlToTabsetHandler implements TabActionMatcher {
  tabMatcher(url: string, content: string, metas: object): boolean {
    return true
  }

  injectScript(): Promise<void> {
    return Promise.resolve()
  }

  actions(): ComponentWithContext[] {
    return []
  }

  clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData = {},
  ): Promise<ExecutionResult<any>> {
    return Promise.reject('noop AddurlToTabsetHandler')
  }

  updateInTabset(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData?: AddUrlToTabsetHandlerAdditionalData,
  ): Promise<ExecutionResult<any>> {
    return Promise.reject('noop AddurlToTabsetHandler')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {
    throw new Error('noop AddurlToTabsetHandler')
  }
}
