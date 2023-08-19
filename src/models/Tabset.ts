import {Tab} from "src/models/Tab";
import {Group} from "src/models/Group";
import {DynamicTabSource} from "src/models/DynamicTabSource";

export enum TabsetStatus {
  DEFAULT = "DEFAULT",
  FAVORITE = "FAVORITE",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED",
  HIDDEN = "HIDDEN"
}

export enum TabsetType {
  DEFAULT = "DEFAULT",
  SESSION = "SESSION",

  SPECIAL = "SPECIAL",
  DYNAMIC = "DYNAMIC"
}

export enum TabsetSharing {
  UNSHARED = "UNSHARED",
  PUBLIC = "PUBLIC",
  PUBLIC_OUTDATED = "PUBLIC_OUTDATED",
  USER = "USER",
  ROLE = "ROLE"
}


export class Tabset {
  id: string

  name: string
  created: number
  updated: number
  tabs: Tab[]
  dynamicTabs: DynamicTabSource | undefined
  groups: Group[]
  spaces: string[] // got json problems with set<string>
  view: string = 'list'
  sorting: string = 'custom'
  status: TabsetStatus = TabsetStatus.DEFAULT
  type: TabsetType = TabsetType.DEFAULT
  sharing: TabsetSharing = TabsetSharing.UNSHARED
  sharedBy: string | undefined = undefined
  sharedId: string | undefined = undefined
  canvas: string | undefined = undefined

  page: string | undefined = undefined

  taxonomy: string | undefined = undefined

  window: string = 'current'

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
