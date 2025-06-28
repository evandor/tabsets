import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { Component } from 'vue'

export type AddUrlToTabsetHandlerAdditionalData = {
  action?: ActionContext
  dialog?: object
  data?: {
    useForLinks?: boolean
    displayFeed?: boolean
    recursive?: boolean
    filename?: string
    more?: object
  }
}

export type ClickedHandler = (
  browserTab: chrome.tabs.Tab,
  ts: Tabset,
  folder?: Tabset,
  additionalData?: AddUrlToTabsetHandlerAdditionalData,
) => Promise<ExecutionResult<any>>

export type ComponentContext = {
  label?: string
  chromeTab?: chrome.tabs.Tab
  currentTabset?: Tabset
}

export type ComponentWithContext = {
  component: Component
  context: ComponentContext
}

/**
 * Implementors define if they want to provide specific actions for the current tab's url and/or content and/or meta information.
 * If the tabMatcher matches, the provided actions (a certain type of Component) are returned and can be used in context menues and the like.
 */
export interface TabActionMatcher {
  tabMatcher(url: string, content: string, metas: object): boolean

  actions: (currentTabsetId: string | undefined, actionProps: ActionProps) => ComponentWithContext[]

  injectScript: () => Promise<void>

  //updateInTabset: ClickedHandler

  handleOpenedTab: (browserTab: chrome.tabs.Tab, tab: Tab) => void
}
