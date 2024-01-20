
export class Window {
  created: number

  constructor(
      public id: number,
      public browserWindow: chrome.windows.Window,
      public title: string | undefined = undefined,
      public index: number = 0) {

    this.created = new Date().getTime()
  }

}
