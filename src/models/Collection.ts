import {Tab} from "src/models/Tab";
import {Group} from "src/models/Group";
import {DynamicTabSource} from "src/models/DynamicTabSource";
import {Entity} from "src/models/Entity";


export class Collection {
  id: string
  name: string
  created: number
  updated: number
  entities: Entity[]
  groups: Group[]
  spaces: string[] // got json problems with set<string>
  view: string = 'list'
  sorting: string = 'custom'
  sharedBy: string | undefined = undefined

  page: string | undefined = undefined

  showPageAsHeader = false

  constructor(id: string, name: string, entities: Entity[], groups: Group[] = [], spaces: string[] = []) {
    this.id = id
    this.name = name
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.entities = entities
    this.groups = groups
    this.spaces = spaces
  }

}
