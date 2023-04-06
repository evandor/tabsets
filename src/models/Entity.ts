

export class Entity {
  created: number
  updated: number
  lastActive: number
  activatedCount: number
  lastLoaded: number
  loadedCount: number
  selected: boolean = false
  name: string | undefined
  description: string
  keywords: string
  image: string
  lastModified: string
  author: string


  constructor(public id: string, chromeTab: chrome.tabs.Tab) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
    this.lastActive = new Date().getTime()
    this.activatedCount = 1
    this.lastLoaded = 0
    this.loadedCount = 0
    this.name = undefined
    this.description = ''
    this.keywords = ''
    this.image = ''
    this.lastModified = ''
    this.author = ''
  }

}

Entity.prototype.toString = function tabToString() {
  return `Entity: {id=${this.id}}`;
};
