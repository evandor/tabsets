import {uid} from "quasar";

export class Tabset {
  id: string
  name: string
  date: number
  tabs: chrome.tabs.Tab[]

  constructor(id: string, name: string, tabs: chrome.tabs.Tab[]) {
    this.id = id
    this.name = name
    this.date = new Date().getTime()
    this.tabs = tabs;
  }
}
