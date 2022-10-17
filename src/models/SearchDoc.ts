export class SearchDoc {
  // id: string // internal id, do not want to rely on chromeTab.id
  created: number


  constructor(
    public id: string,
    public name: string,
    public title: string,
    public url: string,
    public description: string,
    public content: string,
    public tabsets: string[],
    public favIconUrl: string) {

    this.created = new Date().getTime()

  }
}
