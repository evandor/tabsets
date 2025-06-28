// 4 expected diffs to localstorage
// 4 expected diffs to localstorage
import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import { RestApiIdent } from 'src/rest/RestApi'
import { useAuthStore } from 'src/stores/authStore'
import { SharingInfo } from 'src/tabsets/models/SharingInfo'
import { Tab } from 'src/tabsets/models/Tab'
import { TabsetColumn } from 'src/tabsets/models/TabsetColumn'
import { ListDetailLevel } from 'src/ui/stores/uiStore'

export enum TabsetStatus {
  DEFAULT = 'DEFAULT',
  FAVORITE = 'FAVORITE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  HIDDEN = 'HIDDEN',
}

export enum TabsetType {
  DEFAULT = 'DEFAULT',
  SESSION = 'SESSION',

  SPECIAL = 'SPECIAL',
  DYNAMIC = 'DYNAMIC',
  RSS_FOLDER = 'RSS_FOLDER',
  REST = 'REST',
}

export enum TabsetSharing {
  UNSHARED = 'UNSHARED',
  PUBLIC_LINK = 'PUBLIC_LINK',
  PUBLIC_LINK_OUTDATED = 'PUBLIC_LINK_OUTDATED',
  USER = 'USER',
  ROLE = 'ROLE',
}

/**
 * data added when loading and removed before saving (as, for example,
 * it is only specific for the current user, but not for the tabset itself).
 * Kind of transient.
 */
export class AugmentedData {
  sharedAt: number = 0
  readonly: boolean = true
}

export class ChangeInfo {
  date: number = new Date().getTime()
  changedBy: string
  event: string

  constructor(
    public element: 'tabset' | 'tabcomment' | 'tab' = 'tabcomment',
    public change: 'added' | 'deleted' | 'edited' = 'added',
    public elementId: string,
    public tabsetId?: string,
  ) {
    this.date = new Date().getTime()
    this.changedBy = useAuthStore().user.email || ''
    this.event = this.element + '-' + this.change
  }
}

export interface MonitoredTab {
  tabId: string
  changed?: number
}

export const TABSET_NAME_MAX_LENGTH = 32

export class Tabset {
  id: string

  name: string
  created: number
  updated: number
  tabs: Tab[]

  folders: Tabset[] = []
  folderActive: string | undefined = undefined
  folderParent: string | undefined = undefined

  // additional initialization in "loadTabsets()" for older tabsets.
  // in the application, we can assume that columns is always set, at least with an empty array
  // tabs have a columnId field which references a group or which is undefined.
  // a tabset's group _can_ contain a group with identifier "SPECIAL_ID_FOR_NO_GROUP_ASSIGNED"
  // was: groups: Group[]
  columns: TabsetColumn[] = []

  spaces: string[] // got json problems with set<string>
  view: string = 'grid'
  details: ListDetailLevel | undefined = 'DEFAULT'
  sorting: string = 'custom'
  status: TabsetStatus = TabsetStatus.DEFAULT
  type: TabsetType = TabsetType.DEFAULT

  bookmarkId: string | undefined = undefined

  // sharing
  sharing: SharingInfo = new SharingInfo()

  importedAt: number | undefined = undefined

  canvas: object | undefined = undefined

  // = description
  page: string | undefined = undefined

  headerDescription: string | undefined = undefined

  window: string = 'current'
  color: string | undefined = undefined
  dynamicUrl: string | undefined = undefined

  // can be set (to the installtion.id) when saving the tabset in order to omit triggering an update
  origin: string = ''

  size: number = 0

  // should be done using firebase events
  //log: TabsetLog[] = []

  loaded: number = 0 // will always be set when the tabset is loaded
  lastChangeBy: string = '' // set for tabsets with sharedReference

  augmentedData: AugmentedData = new AugmentedData()

  lastChange?: ChangeInfo | undefined = undefined

  restDefinition?: RestApiIdent | undefined = undefined

  monitoredTabs: MonitoredTab[] = []

  newTabSource: boolean = false // used as source for newtab extension (to display URLs in browsers newtab view)

  constructor(id: string, name: string, tabs: Tab[] = [], columns: TabsetColumn[] = [], spaces: string[] = []) {
    // some guards
    if (!Tabset.newTabsetNameIsValid(name)) {
      throw new Error(`Tabset name '${name}' is not valid`)
    }
    if (!Tabset.newTabsetNameIsShortEnough(name)) {
      throw new Error(`Tabset name '${name}' is too long`)
    }

    // assignments
    this.id = id
    this.name = name
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.tabs = tabs
    this.columns = columns
    this.spaces = spaces

    if (!this.view) {
      this.view = 'grid'
    }
    if (!this.folders) {
      this.folders = []
    }
  }

  static newTabsetNameIsValid = (val: string) => {
    return !STRIP_CHARS_IN_USER_INPUT.test(val)
  }

  static newTabsetNameIsShortEnough = (val: string) => (val ? val.length <= TABSET_NAME_MAX_LENGTH : true)

  static logIdent(ts: Tabset | undefined) {
    return ts ? ts.name + '(' + ts.id.substring(0, 8) + ')' : 'undefined'
  }
  // 'addLog is not a method' when not static !?!
  // static addLog = (ts: Tabset, logMsg: string | undefined) => {
  //   if (logMsg) {
  //     if (!ts.log) {
  //       ts.log = []
  //     }
  //     ts.log.push(new TabsetLog(logMsg))
  //   }
  // }
}
