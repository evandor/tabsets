import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import { Window } from 'src/windows/models/Window'

export class WindowAction {
  constructor(
    public icon: string,
    public action: string | undefined = undefined,
    public color: string = 'text-grey',
    public tooltip: string | undefined = undefined,
    public disabled: boolean = false,
  ) {}
}

export class WindowHolder {
  created: number

  private constructor(
    public window: Window, // the window entity from the storage
    public cw: chrome.windows.Window | undefined, // the optional browser Window object if existing
    public holderId: number,
    public index: number,
    public name: string,
    public hostList: string[],
    public additionalActions: WindowAction[],
  ) {
    // could not use sets due to issues

    this.created = new Date().getTime()
    this.name = window?.title || '' + cw?.id || '???'
    this.name = this.name?.replace(STRIP_CHARS_IN_USER_INPUT, '')
    if (!WindowHolder.nameIsShortEnough) {
      throw new Error(`Window name '${name}' is too long`)
    }
  }

  static nameIsShortEnough = (val: string) => (val ? val.length <= 32 : true)

  public static of(
    window: Window,
    cw: chrome.windows.Window | undefined,
    holderId: number,
    additionalActions: WindowAction[],
  ): WindowHolder {
    return new WindowHolder(
      window,
      cw,
      holderId,
      window?.index || 0,
      window?.title || '',
      window?.hostList,
      additionalActions,
    )
  }

  public getName() {
    return this.name
  }

  public getIndex() {
    return this.index
  }

  public getTabsCount() {
    return this.cw?.tabs?.length || 0
  }
}

WindowHolder.prototype.toString = function tabToString() {
  return `WindowHolder: {id=${this.cw?.id}, holderId=${this.holderId}, name=${this.name}, index=${this.index}}`
}
