import {Tab} from "src/models/Tab";
import {Group} from "src/models/Group";

export class Tabset {
  id: string
  name: string
  created: number
  updated: number
  tabs: Tab[]
  groups: Group[]

  constructor(id: string, name: string, tabs: Tab[], groups: Group[]) {
    this.id = id
    this.name = name
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.tabs = tabs
    this.groups = groups
  }
}
