export class Account {
  created: number

  constructor(
    public id: string,
    public userData: object | undefined,
    public products: string[] = [],
  ) {
    this.created = new Date().getTime()
  }

  setProducts(products: string[]) {
    this.products = products
  }
}
