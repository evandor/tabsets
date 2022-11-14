import {Tab} from "src/models/Tab";
import {Group} from "src/models/Group";
import {Space} from "src/models/Space";

export class Tabset {
  id: string
  name: string
  created: number
  updated: number
  tabs: Tab[]
  groups: Group[]
  spaces: string[] // got json problems with set<string>

  constructor(id: string, name: string, tabs: Tab[], groups: Group[] = [], spaces: string[] = []) {
    this.id = id
    this.name = name
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.tabs = tabs
    this.groups = groups
    this.spaces = spaces
  }

}
