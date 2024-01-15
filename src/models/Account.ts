export class Account {
  created: number

  constructor(
    public id: string,
    public userData: object | undefined,
    public subscriptions: object[] = []
  ) {
    this.created = new Date().getTime()
  }

  addSubscription(subscription: object) {
    this.subscriptions.push(subscription)
  }
}
