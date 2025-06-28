import { useAuthStore } from 'src/stores/authStore'

export class TabsetLog {
  date: number
  initiator: string | undefined

  constructor(public msg: string) {
    this.date = new Date().getTime()
    this.initiator = useAuthStore().user.email || undefined
  }
}
