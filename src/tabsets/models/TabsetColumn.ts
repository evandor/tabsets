import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'

export class TabsetColumn {
  constructor(
    public id: string,
    public title: string,
    public open: boolean = false,
  ) {
    this.title = this.title.replace(STRIP_CHARS_IN_USER_INPUT, '')
    if (this.title.length >= 20) {
      this.title = this.title.substring(0, 17) + '...'
    }
  }
}
