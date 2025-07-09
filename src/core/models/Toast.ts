import { uid } from 'quasar'

export enum ToastType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CHOICE = 'CHOICE',
}

export class Toast {
  public id: string
  public created: number

  constructor(
    public msg: string,
    public type: ToastType,
    public actions: any[] = [],
  ) {
    this.id = uid()
    this.created = new Date().getTime()
  }
}
