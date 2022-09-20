import {Tab} from "src/models/Tab";
import {Group} from "src/models/Group";

export enum TabsetPersistence {
  INDEX_DB = "INDEX_DB",
  FIREBASE = "FIREBASE"
}


export class Tabset {
  id: string
  name: string
  created: number
  updated: number
  persistence: TabsetPersistence = TabsetPersistence.INDEX_DB
  tabs: Tab[]
  groups: Group[]

  constructor(id: string, name: string, tabs: Tab[], groups: Group[]) {
    this.id = id
    this.name = name
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.persistence = TabsetPersistence.INDEX_DB
    this.tabs = tabs
    this.groups = groups
  }
}
