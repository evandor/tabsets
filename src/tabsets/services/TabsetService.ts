// 2 expected diffs to localstorage
import _ from 'lodash'
import { uid } from 'quasar'
import AppEventDispatcher from 'src/app/AppEventDispatcher'
import BrowserApi from 'src/app/BrowserApi'
import { ContentItem } from 'src/content/models/ContentItem'
import { useContentService } from 'src/content/services/ContentService'
import { Space } from 'src/spaces/models/Space'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { SpaceEvent, TabEvent, TabsetEvent } from 'src/tabsets/commands/github/GithubWriteEventCommand'
import { Tab, UrlExtension } from 'src/tabsets/models/Tab'
import { Tabset, TabsetSharing, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import PlaceholderUtils from 'src/tabsets/utils/PlaceholderUtils'

// const { saveTabset, saveCurrentTabset, tabsetsFor, addToTabset } = useTabsetService()

class TabsetService {
  eventsFor = async (tabsets: Tabset[], parentId: string | undefined = undefined): Promise<string[]> => {
    const lines: string[] = []
    for (const ts of tabsets) {
      const event = new TabsetEvent('added', ts.id, parentId, ts.name, ts.spaces)
      lines.push(event.format())
      for (const tab of ts.tabs) {
        const event = new TabEvent('added', ts.id, tab.id, tab.title || tab.name || '???', tab.url, tab.favIconUrl)
        lines.push(event.format())
      }
      // const notes = await useNotesStore().getNotesFor(ts.id)
      // for (const note of notes) {
      //   const event = new NoteEvent('added', ts.id, note.title, note)
      //   lines.push(event.format())
      // }
      const folders = await this.eventsFor(ts.folders, ts.id)
      folders.forEach((l) => lines.push(l))
    }
    return lines
  }

  spacesEventsFor = (spaces: Space[]): string[] => {
    const lines: string[] = []
    for (const space of spaces) {
      const event = new SpaceEvent('added', space.id, undefined, space.label)
      lines.push(event.format())
    }
    return lines
  }

  async saveToCurrentTabset(tab: Tab, useIndex: number | undefined = undefined): Promise<Tabset> {
    const currentTs = useTabsetsStore().getCurrentTabset
    if (currentTs) {
      return useTabsetService().addToTabset(currentTs, tab, useIndex)
    }
    return Promise.reject('could not get current tabset')
  }

  isOpen(tabUrl: string): boolean {
    const tabsStore = useTabsStore2()
    return (
      _.filter(tabsStore.browserTabs, (t: chrome.tabs.Tab) => {
        return t?.url === tabUrl
      }).length > 0
    )
  }

  saveSelectedPendingTabs() {
    // this.saveAllPendingTabs(true)
  }

  setOnlySelectedTab(tab: Tab) {
    const currentTabset = useTabsetsStore().getCurrentTabset
    if (currentTabset) {
      _.forEach(currentTabset.tabs, (t: Tab) => {
        //t.selected = t.id === tab.id;
      })
    }
  }

  async getContentFor(selectedTab: Tab): Promise<ContentItem | undefined> {
    return this.getContentForUrl(selectedTab.id)
  }

  async getContentForUrl(tabId: string): Promise<ContentItem | undefined> {
    return useContentService().getContent(tabId)
  }

  async getMetaLinksFor(selectedTab: Tab): Promise<any> {
    if (selectedTab.url) {
      return this.getMetaLinksForUrl(selectedTab.url)
    }
    return Promise.reject('url not provided')
  }

  async getMetaLinksForUrl(url: string): Promise<any> {
    return Promise.reject('not implemented N') //db.getMetaLinks(url)
  }

  async getLinksForUrl(url: string): Promise<any> {
    return Promise.reject('not implemented O') //db.getLinks(url)
  }

  setCustomTitle(tab: Tab, title: string, desc: string): Promise<any> {
    tab.name = title
    tab.longDescription = desc
    return useTabsetService().saveCurrentTabset()
  }

  setColor(tab: Tab, color: string): Promise<any> {
    tab.color = color
    return useTabsetService().saveCurrentTabset()
  }

  setMatcher(tab: Tab, matcher: string | undefined): Promise<any> {
    tab.matcher = matcher
    return useTabsetService().saveCurrentTabset()
  }

  setUrl(
    tab: Tab,
    url: string,
    placeholders: string[] = [],
    placeholderValues: Map<string, string> = new Map(),
    extension: UrlExtension = UrlExtension.HTML,
  ): Promise<any> {
    tab.url = url
    tab.extension = extension
    tab = PlaceholderUtils.apply(tab, placeholders, placeholderValues)
    return useTabsetService().saveCurrentTabset()
  }

  moveToTabset(tabId: string, toTabsetId: string, copy: boolean = false): Promise<any> {
    const tabset = useTabsetsStore().tabsetFor(tabId)
    if (tabset) {
      const tabIndex = _.findIndex(tabset.tabs, { id: tabId })
      const targetTabset = useTabsetsStore().getTabset(toTabsetId)

      if (tabIndex >= 0 && targetTabset) {
        targetTabset.tabs.push(tabset.tabs[tabIndex]!)
        return useTabsetService()
          .saveTabset(targetTabset)
          .then(() => {
            if (copy) {
              let tabWithNewId = Object.assign({}, tabset.tabs[tabIndex])
              tabWithNewId['id'] = uid()
              console.log('copying', tabset.tabs[tabIndex], tabWithNewId)
              tabset.tabs.splice(tabIndex, 1, tabWithNewId)
            } else {
              console.log('not copying...')
              tabset.tabs.splice(tabIndex, 1)
            }
          })
          .then(() => useTabsetService().saveTabset(tabset))
      } else {
        return Promise.reject('could not find tab/tabset ' + tabId + '/' + toTabsetId)
      }
    }
    return Promise.reject('could not find tab ' + tabId)
  }

  async exportData(
    exportAs: string,
    tabsets: Tabset[] | undefined,
    filename: string | undefined = 'tabsets.json',
  ): Promise<any> {
    console.log('exporting as ', exportAs)

    const spacesStore = useSpacesStore()

    let data = ''
    if (exportAs === 'json') {
      tabsets ??= [...useTabsetsStore().tabsets.values()] as Tabset[]
      data = JSON.stringify({
        tabsets: tabsets.filter((ts: Tabset) => ts.status !== TabsetStatus.DELETED),
        spaces: [...spacesStore.spaces.values()],
      })
      return this.createFile(data, filename)
    } else if (exportAs === 'events') {
      tabsets ??= [...useTabsetsStore().tabsets.values()] as Tabset[]
      const tabData = await this.eventsFor(tabsets)
      const spacesData = this.spacesEventsFor([...useSpacesStore().spaces.values()] as Space[])
      return this.createFile(tabData.join('') + spacesData.join(''), 'tabsets-events.txt')
    } else if (exportAs === 'bookmarks') {
      console.log('creating bookmarks...')

      chrome.bookmarks.getChildren('1', (results: chrome.bookmarks.BookmarkTreeNode[]) => {
        _.forEach(results, (r: any) => {
          if (r.title === 'tabsetsBackup') {
            console.log('deleting folder', r.id)
            chrome.bookmarks.removeTree(r.id)
          }
        })
      })

      chrome.bookmarks.create(
        { title: 'tabsetsBackup', parentId: '1' },
        (result: chrome.bookmarks.BookmarkTreeNode) => {
          // console.log("res", result)
          _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
            console.log('ts', ts)
            chrome.bookmarks.create(
              {
                title: ts.name,
                parentId: result.id,
              },
              (folder: chrome.bookmarks.BookmarkTreeNode) => {
                _.forEach(ts.tabs, (tab: Tab) => {
                  chrome.bookmarks.create({
                    title: tab.name || tab.title,
                    parentId: folder.id,
                    url: tab.url,
                  })
                })
              },
            )
          })
        },
      )

      // useBookmarksStore().loadBookmarks()
      //   .then(() => console.log("loaded in service"))
    }
    return Promise.resolve('done')
  }

  importData(json: string) {
    console.log('importing from json')
    let data = JSON.parse(json)
    let tabsets = data.tabsets || data
    let spaces = data.spaces || []
    let notebooks = data.notebooks || []

    _.forEach(spaces, (space: Space) => {
      useSpacesStore().addSpace(space)
    })

    _.forEach(tabsets, (tabset: Tabset) => {
      useTabsetsStore().addTabset(tabset)
      useTabsetService().saveTabset(tabset)

      _.forEach(tabset.tabs, (tab: Tab) => {
        AppEventDispatcher.dispatchEvent('add-to-search', {
          id: tab.id,
          name: tab.title || '',
          title: tab.title || '',
          url: tab.url || '',
          description: tab.description,
          content: '',
          tabsets: [tabset.id],
          favIconUrl: tab.favIconUrl || '',
        })
      })
    })
  }

  createFile(data: string, filename: string) {
    const file = window.URL.createObjectURL(new Blob([data]))
    const docUrl = document.createElement('a')
    docUrl.href = file
    docUrl.setAttribute('download', filename)
    document.body.appendChild(docUrl)
    docUrl.click()
    return Promise.resolve('done')
  }

  // nameForTabsetId(tsId: string): string {
  //   return useTabsetsStore().tabsets.get(tsId)?.name || 'unknown'
  // }

  async trackedTabsCount(): Promise<number> {
    if (!chrome.tabs) {
      return Promise.resolve(0)
    }
    const result: chrome.tabs.Tab[] = await chrome.tabs.query({})
    let trackedTabs = 0
    _.forEach(result, (tab: chrome.tabs.Tab) => {
      if (tab && tab.url && useTabsetService().tabsetsFor(tab.url).length > 0) {
        trackedTabs++
      }
    })
    return trackedTabs
  }

  async trackedIgnoredCount(): Promise<number> {
    return this.iterateOverIgnoredUrl(0, (tab: chrome.tabs.Tab, ignoredUrls: string[], counter: number) => {
      const url = new URL(tab.url!)
      const normalizedUrl = url.protocol + '//' + url.hostname + url.pathname
      if (ignoredUrls.indexOf(normalizedUrl) >= 0) {
        counter++
      }
      return counter
    })
  }

  async closeIgnoredTabs() {
    return this.iterateOverIgnoredUrl(0, (tab: chrome.tabs.Tab, ignoredUrls: string[], counter: number) => {
      const url = new URL(tab.url!)
      const normalizedUrl = url.protocol + '//' + url.hostname + url.pathname
      if (ignoredUrls.indexOf(normalizedUrl) >= 0 && tab.id) {
        console.log('removing', tab.id, tab.url)
        chrome.tabs.remove(tab.id)
        counter++
      }
      return counter
    })
  }

  private async iterateOverIgnoredUrl(
    start: number,
    fkt: (t: chrome.tabs.Tab, ignoredUrls: string[], counter: number) => number,
  ): Promise<number> {
    if (!chrome.tabs) {
      return Promise.resolve(0)
    }
    const result: chrome.tabs.Tab[] = await chrome.tabs.query({})
    let trackedTabs = start
    const ignoredTabset = useTabsetsStore().getTabset('IGNORED')
    if (!ignoredTabset) {
      return start
    }
    for (const tab of result) {
      const ignoredUrls = ignoredTabset.tabs
        .map((t: Tab) => t.url)
        .filter((url: string | undefined) => url !== undefined)
      if (!tab.url) {
        continue
      }
      try {
        trackedTabs = fkt(tab, ignoredUrls, trackedTabs)
      } catch (err) {
        console.log('error when interating over ignored URLS', err)
      }
    }
    return trackedTabs
  }

  async closeTrackedTabs(): Promise<chrome.tabs.Tab[]> {
    // TODO long-Running action
    const currentTab = await BrowserApi.getCurrentTab()

    const result: chrome.tabs.Tab[] = await chrome.tabs.query({})
    const tabsToClose: chrome.tabs.Tab[] = []
    const tabsToKeep: chrome.tabs.Tab[] = []
    _.forEach(result, (tab: chrome.tabs.Tab) => {
      if (tab && tab.url && tab.url !== currentTab.url && useTabsetService().tabsetsFor(tab.url).length > 0) {
        tabsToClose.push(tab)
      } else {
        tabsToKeep.push(tab)
      }
    })
    // console.log("tabsToClose", tabsToClose)
    _.forEach(tabsToClose, (t: chrome.tabs.Tab) => {
      if (t.id) {
        chrome.tabs.remove(t.id)
      }
    })
    return Promise.resolve(tabsToKeep)
  }

  async closeAllTabs() {
    //ChromeApi.closeAllTabs()
  }

  async moveTo(tabId: string, newIndex: number, useActiveFolder: string | undefined = undefined) {
    console.log(`moving tabId ${tabId} to new index ${newIndex}`)
    const currentTabset = useTabsetsStore().getCurrentTabset!
    const activeFolder = useTabsetsStore().getActiveFolder(currentTabset, useActiveFolder)
    console.log('activeFolder', activeFolder?.name, activeFolder?.id)
    let tabs = activeFolder ? activeFolder.tabs : currentTabset.tabs
    // console.log(
    //   'tabs before',
    //   _.map(tabs, (t: any) => t.url),
    // )
    //tabs = _.filter(tabs, (t: Tab) => t.columnId === column.id)
    const oldIndex = _.findIndex(tabs, (t: any) => t.id === tabId)
    if (oldIndex >= 0) {
      // console.log('found old index', oldIndex)
      const tab = tabs.splice(oldIndex, 1)[0]
      tabs.splice(newIndex, 0, tab!)

      // Sharing
      if (currentTabset.sharing.sharedId && currentTabset.sharing.sharing === TabsetSharing.PUBLIC_LINK) {
        currentTabset.sharing.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
      }

      await useTabsetService().saveCurrentTabset()
    }
  }

  setView(tabsetId: string, view: string) {
    console.log('setting view', tabsetId, view)
    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      tabset.view = view
      useTabsetService().saveTabset(tabset)
    }
  }

  toggleSorting(tabsetId: string): string | undefined {
    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      switch (tabset.sorting) {
        case 'custom':
          tabset.sorting = 'alphabeticalUrl'
          break
        case 'alphabeticalUrl':
          tabset.sorting = 'alphabeticalTitle'
          break
        case 'alphabeticalTitle':
          tabset.sorting = 'custom'
          break
        default:
          tabset.sorting = 'custom'
      }
      useTabsetService().saveTabset(tabset)
      return tabset.sorting
    }
    return undefined
  }

  // setPosition(tabId: string, top: number, left: number) {
  //   const tab = _.find(getCurrentTabset()?.tabs, t => t.id === tabId)
  //   if (tab) {
  //     tab.canvasLeft = left
  //     tab.canvasTop = top
  //     saveCurrentTabset()
  //       .catch((err) => console.error("problem saving tabset", err))
  //   } else {
  //     console.log("warning: could not set position for", tabId)
  //   }
  // }
  //
  // saveCanvasLayer(tabsetId: string, layerInfo: string) {
  //   const tabset = getTabset(tabsetId)
  //   if (tabset) {
  //     tabset.canvas = layerInfo
  //     saveTabset(tabset)
  //   } else {
  //     console.log("warning: could not set save canvas for", tabsetId)
  //   }
  // }

  saveNote(tabId: string, note: string, scheduledFor: Date | undefined): Promise<void> {
    // console.log("got", tabId, note)
    const tab = _.find(useTabsetsStore().getCurrentTabset?.tabs, (t: Tab) => t.id === tabId)
    if (tab) {
      tab.note = note
      if (scheduledFor) {
        tab.scheduledFor = scheduledFor.getTime()
      }
      if (tab.url) {
        // TODO
        //useSearchStore().update(tab.url, 'note', note)
      }
      return useTabsetService().saveCurrentTabset()
    }
    return Promise.reject('did not find tab with id ' + tabId)
  }

  // markAsDeleted(tabsetId: string): Promise<Tabset> {
  //   const ts = useTabsetsStore().getTabset(tabsetId)
  //   if (ts) {
  //     ts.status = TabsetStatus.DELETED
  //     return saveTabset(ts)
  //       .then(() => {
  //         if (useTabsetsStore().getCurrentTabset?.id === tabsetId) {
  //           useTabsetsStore().unsetCurrentTabset()
  //         }
  //         return ts
  //       })
  //   }
  //   return Promise.reject("could not mark as deleted: " + tabsetId)
  // }

  share(tabsetId: string, sharing: TabsetSharing, sharedId: string | undefined, sharedBy: string) {
    const tabset = useTabsetsStore().getTabset(tabsetId)!
    return useTabsetsStore().share(tabset, sharing, sharedId, sharedBy)
  }

  shareWith(tabsetId: string, email: string, readonly: boolean, sharedBy: string) {
    const tabset = useTabsetsStore().getTabset(tabsetId)!
    return useTabsetsStore().shareWith(tabset, email, readonly, sharedBy)
  }
}

export default new TabsetService()
