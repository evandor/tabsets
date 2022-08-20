import {uid} from "quasar";

export class Tabset {
  id: string
  name: string
  created: number
  updated: number
  tabs: chrome.tabs.Tab[]

  constructor(id: string, name: string, tabs: Tab[]) {
    this.id = id
    this.name = name
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.tabs = tabs;
  }
}
