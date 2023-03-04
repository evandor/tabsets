
export class Group {

  private created: number;
  private updated: number;

  constructor(
    public id: string,
    public title: string,
    // @ts-ignore
    public chromeGroup: chrome.tabGroups.TabGroup | undefined = undefined) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
  }

}
