export class Account {
  created: number

  constructor(
    public id: string,
    public userData: object | undefined,
    public products: string[] = [],
    public subscriptions: object[] = []
  ) {
    this.created = new Date().getTime()
  }

  setProducts(products: string[]) {
    this.products = products
  }
  addSubscription(subscription: object) {
    this.subscriptions.push(subscription)
  }
}
