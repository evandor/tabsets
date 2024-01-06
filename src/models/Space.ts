
export class Space {
  _id: string
  created: number
  updated: number
  description: string

  constructor(public id: string, public label: string) {
    this._id = "space" + new Date().toJSON()
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.description = ''
  }

}
