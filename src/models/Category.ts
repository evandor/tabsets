import { Tab } from "./Tab"

export class Category {
  created: number
  updated: number
  description: string

  constructor(public id: string, public label: string, public tabs: Tab[] = []) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.description = ''
  }

}
