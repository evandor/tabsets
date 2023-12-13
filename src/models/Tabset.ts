import {Tab} from "src/models/Tab";
import {Group} from "src/models/Group";
import {DynamicTabSource} from "src/models/DynamicTabSource";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {ListDetailLevel} from "stores/uiStore";

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
  PUBLIC_LINK = "PUBLIC_LINK",
  PUBLIC_LINK_OUTDATED = "PUBLIC_LINK_OUTDATED",
  USER = "USER",
  ROLE = "ROLE"
}


export const TABSET_NAME_MAX_LENGTH = 32;

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
  details: ListDetailLevel | undefined = undefined
  sorting: string = 'custom'
  status: TabsetStatus = TabsetStatus.DEFAULT
  type: TabsetType = TabsetType.DEFAULT
  sharing: TabsetSharing = TabsetSharing.UNSHARED
  sharedBy: string | undefined = undefined
  sharedId: string | undefined = undefined
  sharedAt: number | undefined = undefined
  sharedPath: string | undefined = undefined // e.g. /imp/AlCYSrGGmOnsOnf0htA9?n=c2hvcHBpbmc=

  importedAt: number | undefined = undefined

  canvas: object | undefined = undefined

  page: string | undefined = undefined

  window: string = 'current'
  color: string | undefined = undefined

  constructor(id: string, name: string, tabs: Tab[], groups: Group[] = [], spaces: string[] = []) {

    // some guards
    if (!Tabset.newTabsetNameIsValid) {
      throw new Error(`Tabset name '${name}' is not valid`)
    }
    if (!Tabset.newTabsetNameIsShortEnough) {
      throw new Error(`Tabset name '${name}' is too long`)
    }

    // assignments
    this.id = id
    this.name = name
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.tabs = tabs
    this.groups = groups
    this.spaces = spaces
  }

  static newTabsetNameIsValid = (val: string) => !STRIP_CHARS_IN_USER_INPUT.test(val)

  static newTabsetNameIsShortEnough = (val: string) => val ? val.length <= TABSET_NAME_MAX_LENGTH : true

}
