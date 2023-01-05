export default class ExpiringMap<T> {

  private items: Map<T, any>;
  private readonly expireIn: number;

  constructor(expireIn: number) {
    this.items = new Map()
    this.expireIn = expireIn
  }

  put(key:T, value:any) {
    this.items.set(key, value)
    setTimeout(() => {
      this.items.delete(key)
    }, this.expireIn)
  }

  get(key:T) {
    return this.items.get(key)
  }
}
