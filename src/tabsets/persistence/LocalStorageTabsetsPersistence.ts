import { LocalStorage } from 'quasar'
import { TabsetForSpace } from 'src/tabsets/models/SpaceToTabsetsMap'

export class LocalStorageTabsetsPersistence {
  getLastUsedTabsets(spaceId: string | undefined): string[] {
    const fromStorage = LocalStorage.getItem('ui.tabsets.lastUsed') as string
    const space = spaceId ? spaceId : 'nospace'
    if (fromStorage) {
      var allUsedTabsets = JSON.parse(fromStorage) as TabsetForSpace[]
      const res = allUsedTabsets.filter((t: TabsetForSpace) => t.identifier === space)
      return res.length > 0 ? res[0]!.tabsets : []
    }
    return []
  }

  updateLastUsedTabsets(spaceId: string | undefined, list: string[]): void {
    const fromStorage = LocalStorage.getItem('ui.tabsets.lastUsed') as string
    const space = spaceId ? spaceId : 'nospace'
    var allUsedTabsets: TabsetForSpace[] = fromStorage ? (JSON.parse(fromStorage) as TabsetForSpace[]) : []
    const foundIndex = allUsedTabsets.findIndex((t) => t.identifier === space)
    if (foundIndex >= 0) {
      allUsedTabsets.splice(foundIndex, 1)
    }
    allUsedTabsets.push(new TabsetForSpace(space, list))
    LocalStorage.setItem('ui.tabsets.lastUsed', JSON.stringify(allUsedTabsets))
  }

  clear(spaceId: string | undefined) {
    const fromStorage = LocalStorage.getItem('ui.tabsets.lastUsed') as string
    const space = spaceId ? spaceId : 'nospace'
    var allUsedTabsets: TabsetForSpace[] = fromStorage ? (JSON.parse(fromStorage) as TabsetForSpace[]) : []
    const foundIndex = allUsedTabsets.findIndex((t) => t.identifier === space)
    if (foundIndex >= 0) {
      allUsedTabsets.splice(foundIndex, 1)
    }
    LocalStorage.setItem('ui.tabsets.lastUsed', JSON.stringify(allUsedTabsets))
  }
}
