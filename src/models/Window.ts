import {Tab} from "src/models/Tab";

export class Window {
  created: number

  constructor(
      public id: number,
      public browserWindow: chrome.windows.Window | undefined,
      public title: string | undefined = undefined,
      public index: number = 0,
      public open = false,
      public hostList: string[] = []) { // could not use sets due to issues

    this.created = new Date().getTime()
  }

}

Window.prototype.toString = function tabToString() {
  return `Window: {id=${this.id}, browserWindow=${this.browserWindow !== undefined}, title=${this.title}, index=${this.index}, open=${this.open}, #hostList=${this.hostList.length}}`;
};
