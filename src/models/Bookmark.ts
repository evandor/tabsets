
export class Bookmark {
  // id: string // internal id, do not want to rely on chromeTab.id
  created: number
  updated: number
  lastActive: number
  activatedCount: number
  lastLoaded: number
  loadedCount: number
  chromeBookmark: chrome.bookmarks.BookmarkTreeNode
  selected: boolean = false
  name: string | undefined

  constructor(public id: string, chromeBookmark: chrome.bookmarks.BookmarkTreeNode) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.lastActive = 0
    this.activatedCount = 0
    this.lastLoaded = 0
    this.loadedCount = 0
    this.chromeBookmark = chromeBookmark
    this.name = undefined
  }

  public setName(newName: string): void {
    // TODO validate
    this.name = newName
  }
}
