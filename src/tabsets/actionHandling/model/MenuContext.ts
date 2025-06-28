import { QVueGlobals } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { AddUrlToTabsetHandlerAdditionalData, ClickedHandler } from 'src/tabsets/actionHandling/TabActionMatcher'
import { Tabset } from 'src/tabsets/models/Tabset'

export class MenuContext {
  public clicked?: ClickedHandler

  public colorFkt?: () => string

  $q?: QVueGlobals

  constructor(
    public label: string,
    public icon?: string,
    public folder?: Tabset,
    public additionalData?: object,
    public active?: (t: chrome.tabs.Tab) => boolean,
  ) {}

  onClicked(
    clicked: (
      chromeTab: chrome.tabs.Tab,
      ts: Tabset,
      folder?: Tabset,
      additionalData?: AddUrlToTabsetHandlerAdditionalData,
    ) => Promise<ExecutionResult<any>>,
  ) {
    this.clicked = clicked
    return this
  }

  setColor(fkt: () => string) {
    this.colorFkt = fkt
    return this
  }
}
