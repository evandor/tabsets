import TabsetsGroupsPersistence from 'src/tabsets/persistence/TabsetsGroupsPersistence'

class IndexedDbTabsetsGroupsPersistence implements TabsetsGroupsPersistence {
  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    // console.debug(' ...initializing tabsets (IndexedDbSpacesStorage)')
    //this.db = await this.initDatabase()
    return Promise.resolve()
  }

  addGroup(group: chrome.tabGroups.TabGroup): Promise<any> {
    return Promise.resolve(undefined)
  }

  clear(name: string): void {}

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  deleteGroupByTitle(title: string): Promise<void> {
    return Promise.resolve(undefined)
  }

  getGroups(): Promise<chrome.tabGroups.TabGroup[]> {
    return Promise.resolve([])
  }

  migrate(): any {}

  updateGroup(group: chrome.tabGroups.TabGroup): Promise<any> {
    return Promise.resolve(undefined)
  }
}

export default new IndexedDbTabsetsGroupsPersistence()
