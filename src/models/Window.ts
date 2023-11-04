
export class Window {
  created: number

  constructor(
      public id: number,
      public browserWindow: chrome.windows.Window,
      public title: string | undefined = undefined) {
    this.created = new Date().getTime()
  }

}
