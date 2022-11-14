
export class Space {
  created: number
  updated: number
  description: string

  constructor(public id: string, public label: string) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.description = ''
  }

}
