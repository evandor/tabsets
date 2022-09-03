export enum TabStatus {
  CREATED = "CREATED",
  DELETED = "DELETED",
  DEFAULT = "DEFAULT"
}

export class Tab {
  id: string // internal id, do not want to rely on chromeTab.id
  private created: number
  updated: number
  lastActive: number
  activatedCount: number
  lastLoaded: number
  loadedCount: number
  chromeTab: chrome.tabs.Tab
  status: TabStatus
  isDuplicate: boolean

  constructor(id: string, chromeTab: chrome.tabs.Tab) {
    this.id = id
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.lastActive = 0
    this.activatedCount = 0
    this.lastLoaded = 0
    this.loadedCount = 0
    this.chromeTab = chromeTab
    this.status = TabStatus.DEFAULT
    this.isDuplicate = false
  }
}
