import {Placeholders} from "src/models/Placeholders";

export enum TabSorting {
  URL = "URL",
  TITLE = "TITLE",
  AGE = "AGE",
  CUSTOM = "CUSTOM"
}

export enum UrlExtension {
  HTML = "HTML",
  RSS = "RSS",
  PDF = "PDF",
  IMAGE = "IMAGE",
  NOTE = "NOTE",
  UNKNOWN = "UNKNOWN"
}

export class HTMLSelectionComment {

  date: number = 0

  constructor(
    public author: string = '',
    public comment: string = '') {
    this.date = new Date().getTime()
  }
}

export class HTMLSelection {
  constructor(
    public selection: string = '',
    public text: string = '',
    public comments: HTMLSelectionComment[] = []) {
  }
}

export class Tab {
  created: number
  updated: number
  lastActive: number
  activatedCount: number
  loadedCount: number

  // from chrome tab
  chromeTabId: number | undefined
  favIconUrl: string | undefined
  url: string | undefined
  title: string | undefined
  pinned: boolean
  groupId: number

  isDuplicate: boolean
  history: string[] = []
  selected: boolean = false
  name: string | undefined
  bookmarkUrl: string | undefined
  bookmarkId: string | undefined
  description: string
  longDescription: string | undefined
  keywords: string
  tags: string[] // Set<string> got issues in indexeddb
  image: string
  date: string
  lastModified: string
  author: string
  note: string
  scheduledFor: number | undefined
  extension: UrlExtension
  selections: HTMLSelection[] = []
  annotations: any[] = []

  mhtmls: string[]

  contentHash: string

  httpStatus: number = 200
  httpContentType: string = 'undefined'
  httpLastModified: string = 'undefined'
  httpCheckedAt: number = 0
  httpError: string = ''
  httpInfo: string = 'undefined'

  placeholders: Placeholders | undefined

  color: string | undefined = undefined
  matcher: string | undefined = undefined

  group: chrome.tabGroups.TabGroup | undefined = undefined

  constructor(public id: string, chromeTab: chrome.tabs.Tab) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.lastActive = new Date().getTime()
    this.activatedCount = 1
    this.loadedCount = 0

    this.chromeTabId = chromeTab.id
    this.favIconUrl = chromeTab.favIconUrl
    this.url = chromeTab.url
    this.title = chromeTab.title
    this.pinned = chromeTab.pinned
    this.groupId = chromeTab.groupId
    this.group = undefined // to be set from 'outside'

    //this.chromeTab = chromeTab
    this.isDuplicate = false
    this.history = []
    this.name = undefined
    this.description = ''
    this.keywords = ''
    this.tags = []
    this.image = ''
    this.date = ''
    this.lastModified = ''
    this.author = ''
    this.note = ''
    this.scheduledFor = undefined
    this.extension = this.determineUrlExtension(chromeTab)
    this.mhtmls = []
    this.contentHash = ''
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

  addToMHtmls(id: string) {
    if (!this.mhtmls) {
      this.mhtmls = [] as unknown as string[]
    }
    this.mhtmls.push(id)
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
        console.error("checking extension url: ", chromeTab.url, err)
      }
    }
    return ext
  }

}

Tab.prototype.toString = function tabToString() {
  return `Tab: {id=${this.id}, url=${this.url}, #history=${this.history.length}}`;
};
