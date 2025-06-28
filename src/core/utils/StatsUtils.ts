import { LocalStorage } from 'quasar'
import { useBookmarksStore } from 'src/bookmarks/stores/bookmarksStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useAuthStore } from 'src/stores/authStore'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useWindowsStore } from 'src/windows/stores/windowsStore'

export interface StatRow {
  name: string
  count: number
  snapshot: any
  link?: string
  quota: number | undefined
}

class StatsUtils {
  getFromSnapshot = (statsSnapshot: object | undefined, ident: string): number | undefined => {
    if (!statsSnapshot) {
      return undefined
    }
    const vals = statsSnapshot['values' as keyof object] as Array<any>
    if (!vals) {
      return undefined
    }
    for (const v of [...vals]) {
      if (v['name'] === ident) {
        return v['count' as keyof object]
      }
    }
  }

  calcStatsRows = (): StatRow[] => {
    const statsSnapshot = (LocalStorage.getItem('stats') as object) || undefined

    return [
      {
        name: 'Tabs',
        count: useTabsetsStore().allTabsCount,
        snapshot: this.getFromSnapshot(statsSnapshot, 'Tabs'),
        quota: useAuthStore().limitExceeded('TABS', useTabsetsStore().allTabsCount).quota,
      },
      {
        name: 'Tabsets',
        count: useTabsetsStore().tabsets.size,
        snapshot: this.getFromSnapshot(statsSnapshot, 'Tabsets'),
        quota: useAuthStore().limitExceeded('TABSETS', useTabsetsStore().tabsets.size).quota,
      },
      {
        name: 'Spaces',
        count: useSpacesStore().spaces.size,
        snapshot: this.getFromSnapshot(statsSnapshot, 'Spaces'),
        quota: useAuthStore().limitExceeded('SPACES', useSpacesStore().spaces.size).quota,
      },
      {
        name: 'Thumbnails (MByte)',
        count: useAuthStore().getUserData().thumbnails,
        snapshot: this.getFromSnapshot(statsSnapshot, 'Thumbnails'),
        quota: useAuthStore().limitExceeded('THUMBNAILS', useAuthStore().getUserData().thumbnails).quota,
      },
      {
        name: 'Bookmarks',
        count: useBookmarksStore().bookmarksCount,
        snapshot: this.getFromSnapshot(statsSnapshot, 'Bookmarks'),
        link: 'https://docs.tabsets.net/bookmarks',
        quota: undefined,
      },
      {
        name: 'Bookmark Folders',
        count: useBookmarksStore().foldersCount,
        snapshot: this.getFromSnapshot(statsSnapshot, 'Bookmark Folders'),
        quota: undefined,
      },
      {
        name: 'Open Windows',
        count: useWindowsStore().currentBrowserWindows.length,
        snapshot: this.getFromSnapshot(statsSnapshot, 'Open Windows'),
        link: 'https://docs.tabsets.net/windows-management',
        quota: undefined,
      },
      {
        name: 'Open Tabs',
        count: useTabsStore2().tabsCount,
        snapshot: this.getFromSnapshot(statsSnapshot, 'Open Tabs'),
        quota: undefined,
      },
    ]
  }
}

export default new StatsUtils()
