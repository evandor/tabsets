
export class Group {

  private created: number;
  private updated: number;

  constructor(
    public id: string,
    // @ts-ignore
    public chromeGroup: chrome.tabGroups.TabGroup) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
  }

}
