import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import { TABSET_NAME_MAX_LENGTH } from 'src/tabsets/models/Tabset'

export class Space {
  created: number
  updated: number
  description: string

  constructor(
    public id: string,
    public label: string,
  ) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.description = ''

    if (!Space.labelIsvalid) {
      throw new Error(`Space label '${label}' is not valid`)
    }
    if (!Space.labelIsShortEnough) {
      throw new Error(`Space label '${label}' is too long`)
    }
  }

  static labelIsvalid = (val: string) => !STRIP_CHARS_IN_USER_INPUT.test(val)

  static labelIsShortEnough = (val: string) => (val ? val.length <= TABSET_NAME_MAX_LENGTH : true)
}
