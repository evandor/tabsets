
export class Window {
  created: number

  constructor(
      public id: number,
      public browserWindow: chrome.windows.Window,
      public title: string | undefined = undefined,
      public index: number = 0,
      public hostList: Set<string> = new Set()) {

    this.created = new Date().getTime()
  }

}
