export class TabsetColumn {

  private created: number;
  private updated: number;

  constructor(
    public id: string,
    public title: string,
    public open: boolean = false) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
  }

}
