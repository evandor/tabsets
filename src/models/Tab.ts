export enum TabStatus {
  CREATED = "CREATED",
  DELETED = "DELETED",
  DEFAULT = "DEFAULT"
}

export class Tab {
  // id: string // internal id, do not want to rely on chromeTab.id
  created: number
  updated: number
  lastActive: number
  activatedCount: number
  lastLoaded: number
  loadedCount: number
  chromeTab: chrome.tabs.Tab
  status: TabStatus
  isDuplicate: boolean
  history: string[] = []
  selected: boolean = false
  name: string | undefined
  bookmarkUrl: string | undefined
  bookmarkId: string | undefined
  metas: object
  searchIndexId: number | undefined

  constructor(public id: string, chromeTab: chrome.tabs.Tab) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.lastActive = 0
    this.activatedCount = 0
    this.lastLoaded = 0
    this.loadedCount = 0
    this.chromeTab = chromeTab
    this.status = TabStatus.DEFAULT
    this.isDuplicate = false
    this.history = []
    this.name = undefined
    this.metas = {}
  }

  setHistoryFrom(existingTab: Tab) {
    if (existingTab.history) {
      this.history = existingTab.history
    } else {
      this.history = []
    }
  }

  addToHistory(url: string) {
    if (!this.history) {
      this.history = [] as unknown as string[]
    }
    this.history.push(url)
  }

  hasHistory(): boolean {
    // console.log("has", this.history)
    return true //this.history && this.history.length > 0
  }

  public setName(newName: string): void {
    // TODO validate
    this.name = newName
  }
}
