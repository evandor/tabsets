import {uid} from "quasar";

export enum TabStatus {
  CREATED = "CREATED",
  DELETED = "DELETED",
  DEFAULT = "DEFAULT"
}

export class Tab {
  private id: string
  private created: number
  updated: number
  lastActive: number
  activatedCount: number
  lastLoaded: number
  loadedCount: number
  chromeTab: chrome.tabs.Tab
  status: TabStatus

  constructor(chromeTab: chrome.tabs.Tab) {
    this.id = uid()
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.lastActive = 0
    this.activatedCount = 0
    this.lastLoaded = 0
    this.loadedCount = 0
    this.chromeTab = chromeTab
    this.status = TabStatus.DEFAULT
  }
}
