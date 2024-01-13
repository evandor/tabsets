export class Account {
  created: number

  constructor(
    public id: string) {
    this.created = new Date().getTime()
  }

}
