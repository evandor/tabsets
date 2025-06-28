interface TabsetsGroupsPersistence {
  getServiceName(): string

  init(): Promise<any>

  addGroup(group: chrome.tabGroups.TabGroup): Promise<any>

  updateGroup(group: chrome.tabGroups.TabGroup): Promise<any>

  getGroups(): Promise<chrome.tabGroups.TabGroup[]>

  deleteGroupByTitle(title: string): Promise<void>

  compactDb(): Promise<any>

  clear(name: string): void

  // optional migration code for 0.4.11 to 0.5.0
  migrate(): any
}

export default TabsetsGroupsPersistence
