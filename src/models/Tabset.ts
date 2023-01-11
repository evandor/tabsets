import {Tab} from "src/models/Tab";
import {Group} from "src/models/Group";

export enum TabsetStatus {
  DEFAULT= "DEFAULT",
  FAVORITE = "FAVORITE",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED"
}

export enum TabsetType {
  DEFAULT= "DEFAULT",
  SESSION = "SESSION"
}

export class Tabset {
  id: string
  name: string
  created: number
  updated: number
  tabs: Tab[]
  groups: Group[]
  spaces: string[] // got json problems with set<string>
  view: string = 'list'
  status: TabsetStatus = TabsetStatus.DEFAULT
  type: TabsetType = TabsetType.DEFAULT

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
