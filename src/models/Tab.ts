import {SavePendingTabToCurrentTabsetCommand} from "src/domain/commands/SavePendingTabToCurrentTabsetCommand";

export enum UrlExtension {
  HTML = "HTML",
  RSS = "RSS",
  IMAGE = "IMAGE",
  UNKNOWN = "UNKNOWN"
}

export class Tab {
  created: number
  updated: number
  lastActive: number
  activatedCount: number
  lastLoaded: number
  loadedCount: number
  chromeTab: chrome.tabs.Tab
  isDuplicate: boolean
  history: string[] = []
  selected: boolean = false
  name: string | undefined
  bookmarkUrl: string | undefined
  bookmarkId: string | undefined
  description: string
  keywords: string
  image: string
  date: string
  lastModified: string
  author: string
  note: string
  scheduledFor: number | undefined
  canvasLeft: number
  canvasTop: number
  extension: UrlExtension

  constructor(public id: string, chromeTab: chrome.tabs.Tab) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.lastActive = new Date().getTime()
    this.activatedCount = 1
    this.lastLoaded = 0
    this.loadedCount = 0
    this.chromeTab = chromeTab
    this.isDuplicate = false
    this.history = []
    this.name = undefined
    this.description = ''
    this.keywords = ''
    this.image = ''
    this.date = ''
    this.lastModified = ''
    this.author = ''
    this.note = ''
    this.scheduledFor = undefined
    this.canvasTop = 0
    this.canvasLeft = 0
    this.extension = this.determineUrlExtension(chromeTab)
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

  determineUrlExtension(chromeTab: chrome.tabs.Tab): UrlExtension {
    let ext = UrlExtension.UNKNOWN
    if (chromeTab?.url) {
      try {
        const url = new URL(chromeTab.url)
        ext = UrlExtension.HTML
        const urlToCheck = url.href.toLowerCase().split("?")[0]
        //console.log("urlToCheck", urlToCheck)
        if (urlToCheck.endsWith(".rss")) {
          ext = UrlExtension.RSS
        } else if (urlToCheck.endsWith(".rdf")) {
          ext = UrlExtension.RSS
        } else if (urlToCheck.endsWith(".xml")) {
          ext = UrlExtension.RSS
        } else if (urlToCheck.endsWith(".png") || urlToCheck.endsWith(".jpg") || urlToCheck.endsWith(".jpeg")) {
          ext = UrlExtension.IMAGE
        }
      } catch (err) {
        console.error("checking extension url: ", err)
      }
    }
    return ext
  }

  // hasHistory(): boolean {
  //   // console.log("has", this.history)
  //   return true //this.history && this.history.length > 0
  // }
  //
  // public setName(newName: string): void {
  //   // TODO validate
  //   this.name = newName
  // }
}

Tab.prototype.toString = function tabToString() {
  return `Tab: {id=${this.id}, url=${this.chromeTab.url}}`;
};
