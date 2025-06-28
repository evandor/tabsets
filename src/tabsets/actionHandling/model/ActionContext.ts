import { DialogChainObject, QVueGlobals } from 'quasar'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { AddUrlToTabsetHandlerAdditionalData, ClickedHandler } from 'src/tabsets/actionHandling/TabActionMatcher'
import { Tabset } from 'src/tabsets/models/Tabset'

export class ActionContext {
  public clicked?: ClickedHandler

  public dialog?: ($q: QVueGlobals) => Promise<DialogChainObject>

  public ok?: (payload: any) => ClickedHandler

  public colorFkt: () => string = () => ''
  public styleFkt: (t: chrome.tabs.Tab, folder: Tabset | undefined) => string = (
    t: chrome.tabs.Tab,
    folder: Tabset | undefined,
  ) => ''

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

  withDialog(withDialog: ($q: QVueGlobals) => Promise<DialogChainObject>, $q: QVueGlobals) {
    this.dialog = withDialog
    this.$q = $q
    return this
  }

  onOk(onOkFunction: (data: any) => ClickedHandler) {
    this.ok = onOkFunction
    return this
  }

  setColor(fkt: () => string) {
    this.colorFkt = fkt
    return this
  }

  setStyle(fkt: (tab: chrome.tabs.Tab, folder: Tabset | undefined) => string) {
    this.styleFkt = fkt
    return this
  }
}
