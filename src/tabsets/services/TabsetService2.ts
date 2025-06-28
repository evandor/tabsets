import _ from 'lodash'
import { LocalStorage, uid } from 'quasar'
import AppEventDispatcher from 'src/app/AppEventDispatcher'
import ChromeApi from 'src/app/BrowserApi'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import {
  GITHUB_AUTO_SYNC,
  GITHUB_AUTO_SYNC_READONLY,
  STRIP_CHARS_IN_COLOR_INPUT,
  STRIP_CHARS_IN_USER_INPUT,
} from 'src/boot/constants'
import { ContentItem } from 'src/content/models/ContentItem'
import { useContentService } from 'src/content/services/ContentService'
import { TabPredicate } from 'src/core/domain/Types'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import JsUtils from 'src/core/utils/JsUtils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
// import NavigationService from 'src/services/NavigationService'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useAuthStore } from 'src/stores/authStore'
import { GithubWriteEventCommand, TabEvent, TabsetEvent } from 'src/tabsets/commands/github/GithubWriteEventCommand'
import { SaveOrReplaceResult } from 'src/tabsets/models/SaveOrReplaceResult'
import { Tab } from 'src/tabsets/models/Tab'
import { TabInFolder } from 'src/tabsets/models/TabInFolder'
import { ChangeInfo, Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useSelectedTabsetService } from 'src/tabsets/services/selectedTabsetService' // let db: TabsetsPersistence = null as unknown as TabsetsPersistence
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import throttledQueue from 'throttled-queue'
import { v5 as uuidv5 } from 'uuid'
import { ref } from 'vue'

export function useTabsetService() {
  const throttleOne50Millis = throttledQueue(1, 50, true)

  const initialized = ref(false)

  const init = async () => {
    function selectFirstAvailableTabset() {
      const ts = [...useTabsetsStore().tabsets.values()] as Tabset[]
      if (ts.length > 0) {
        useTabsetsStore().selectCurrentTabset(ts[0]!.id)
      }
    }

    // console.debug(' ...initializing tabsetService2 as (TODO)')
    await useTabsetsStore().loadTabsets()
    const selectedTabsetId = await useSelectedTabsetService().getFromStorage()
    if (selectedTabsetId) {
      //console.debug(` ...config: setting selected tabset from storage: ${selectedTabsetId}`)
      const selectedTabset = await useTabsetsStore().selectCurrentTabset(selectedTabsetId)
      if (!selectedTabset) {
        selectFirstAvailableTabset()
      }
    } else {
      selectFirstAvailableTabset()
    }
    initialized.value = true
  }

  function updateTags(chromeTabs: chrome.tabs.Tab[], name: string) {
    return _.map(chromeTabs, (t: chrome.tabs.Tab) => {
      const tab = new Tab(uid(), t)
      Tab.addTags(tab, [name])
      return tab
    })
  }

  /**
   * Will create a new tabset (or update an existing one with matching name) from
   * the provided Chrome tabs.
   *
   * Use case: https://skysail.atlassian.net/wiki/spaces/TAB/pages/807927852/Creating+a+Tabset
   *
   * The tabset is created or updated in the store, and the new data is persisted.
   *
   * @param name the tabset's name
   * @param chromeTabs an array of Chrome tabs
   * @param color
   * @param spaceId
   */
  const saveOrReplaceFromChromeTabs = async (
    name: string,
    chromeTabs: chrome.tabs.Tab[],
    color: string | undefined = undefined,
    spaceId: string | undefined = undefined,
  ): Promise<SaveOrReplaceResult> => {
    const trustedName = name.replace(STRIP_CHARS_IN_USER_INPUT, '').substring(0, 31)
    const trustedColor = color ? color.replace(STRIP_CHARS_IN_COLOR_INPUT, '').substring(0, 31) : undefined
    const tabs: Tab[] = updateTags(chromeTabs, name)

    try {
      const tabset = await useTabsetsStore().createTabset(trustedName, tabs, trustedColor, spaceId)
      await useTabsetsStore().saveTabset(tabset)
      selectTabset(tabset.id)
      useTabsetService().addToSearchIndex(tabset.id, tabs)
      return new SaveOrReplaceResult(false, tabset, false)
    } catch (err: any) {
      return Promise.reject('problem updating or creating tabset: ' + err.toString())
    }
  }

  const copyFromTabset = async (tabset: Tabset, spaceId: string | undefined = undefined): Promise<object> => {
    function nameFrom(name: string): string {
      const nameCandidate = name + ' - Copy'
      const existsAlready = useTabsetsStore().existingInTabset(nameCandidate, spaceId)
      return existsAlready ? nameFrom(nameCandidate) : nameCandidate.replace(STRIP_CHARS_IN_USER_INPUT, '')
    }

    const copyName = nameFrom(tabset.name)
    try {
      const tabsetCopy = await useTabsetsStore().createTabset(copyName, tabset.tabs)
      if (spaceId) {
        tabset.spaces = [spaceId]
      } else {
        tabset.spaces = []
      }
      await saveTabset(tabsetCopy)
      selectTabset(tabsetCopy.id)
      //useSearchStore().indexTabs(tabsetCopy.id, tabsetCopy.tabs)
      return {
        replaced: false,
        tabset: tabsetCopy,
        merged: false,
      }
    } catch (err: any) {
      return Promise.reject('problem copying tabset: ' + err.toString())
    }
  }

  /**
   * Will create a new tabset (or update an existing one with matching name) from
   * the provided bookmarks.
   *
   * The tabset is created or updated in the store, and the new data is persisted.
   *
   * @param name the tabset's name (TODO: validation)
   * @param bms an array of Chrome bookmarks.
   * @param merge if true, the old values and the new ones will be merged.
   */
  const saveOrReplaceFromBookmarks = async (
    name: string,
    bms: chrome.bookmarks.BookmarkTreeNode[],
    merge: boolean = false,
    dryRun = false,
  ): Promise<object> => {
    const trustedName = name.replace(STRIP_CHARS_IN_USER_INPUT, '').substring(0, 31)
    const now = new Date().getTime()
    const tabs = _.map(
      _.filter(bms, (bm: any) => bm.url !== undefined),
      (c: any) => {
        const tab = new Tab(uid(), ChromeApi.createChromeTabObject(c.title, c.url || '', ''))
        tab.bookmarkUrl = c.url
        tab.bookmarkId = c.id
        tab.created = c.dateAdded || 0
        tab.updated = now
        return tab
      },
    )

    const ignoreDuplicates = dryRun
    let tabset: Tabset | undefined = undefined
    if (merge) {
      const currentTs = useTabsetsStore().getCurrentTabset
      if (currentTs && currentTs.name === trustedName) {
        tabset = currentTs
        tabs
          .filter((t: Tab) => {
            const foundIndex = currentTs.tabs.map((t: Tab) => t.url || '').findIndex((url: string) => t.url === url)
            return foundIndex < 0
          })
          .forEach((t: Tab) => tabset!.tabs.push(t))
      }
    }
    if (!tabset) {
      tabset = await useTabsetsStore().createTabset(trustedName, tabs, undefined, undefined, ignoreDuplicates)
    }
    if (!dryRun) {
      await saveTabset(tabset)
      selectTabset(tabset.id)
    }
    return {
      tabsetId: tabset.id,
      replaced: false,
      merged: false,
      updated: now,
      tabset: tabset,
    }
  }

  const reloadTabset = async (tabsetId: string, caller: string | undefined = undefined): Promise<Tabset> => {
    return await useTabsetsStore().reloadTabset(tabsetId, caller)
  }

  const selectTabset = (tabsetId: string | undefined): void => {
    //console.debug('selecting tabset', tabsetId)
    if (tabsetId) {
      useTabsetsStore().selectCurrentTabset(tabsetId)
    }
    //tabsStore.currentTabsetId = tabsetId || null as unknown as string;
    ChromeApi.buildContextMenu('tabsetService 230')
  }

  const deleteTabset = async (tabsetId: string): Promise<string> => {
    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      _.forEach(useTabsetsStore().getTabset(tabsetId)?.tabs, (t: Tab) => {
        console.debug(t, 'removing thumbnails')
        AppEventDispatcher.dispatchEvent('remove-captured-screenshot', {
          tabId: t.id,
        })
        //useThumbnailsService().removeThumbnailsFor(t.id)
      })

      await useTabsetsStore().deleteTabset(tabsetId)

      //await db.deleteTabset(tabsetId)

      //this.db.delete('tabsets', tabsetId)
      const nextKey: string | undefined = useTabsetsStore().tabsets.keys().next().value
      console.log('setting next key to', nextKey)
      selectTabset(nextKey)

      if (LocalStorage.getItem(GITHUB_AUTO_SYNC) && !LocalStorage.getItem(GITHUB_AUTO_SYNC_READONLY)) {
        useCommandExecutor()
          .execute(new GithubWriteEventCommand(new TabsetEvent('deleted', tabsetId, undefined, '', [])))
          .catch((err) => console.warn(err))
      }
      return Promise.resolve('ok')
    }
    return Promise.reject('could not get tabset for id')
  }

  const deleteTabsetDescription = (tabsetId: string): Promise<string> => {
    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      tabset.page = undefined
      useTabsetService().saveTabset(tabset)
      return Promise.resolve('done')
    }
    return Promise.reject('could not get tabset for id')
  }

  const deleteTabsetFolder = (tabset: Tabset, folder: Tabset): Promise<string> => {
    removeFolder(tabset, folder.id)
    tabset.folderActive = undefined
    useTabsetService().saveTabset(tabset)
    return Promise.resolve('done')
  }

  const deleteFromTabset = (tabsetId: any, predicate: TabPredicate): Promise<number> => {
    console.log('deleting from tabset')
    const ts = useTabsetsStore().getTabset(tabsetId)
    if (ts) {
      const tabsCount = ts.tabs.length
      const tabsToKeep: Tab[] = _.filter(ts.tabs, (t: Tab) => !predicate(t))
      console.debug('found tabsToKeep', tabsToKeep)
      ts.tabs = tabsToKeep
      return saveTabset(ts).then((res) => tabsCount - tabsToKeep.length)
    }
    return Promise.reject('did not find tabset for id ' + tabsetId)
  }

  const rootTabsetFor = (ts: Tabset | undefined): Tabset | undefined => {
    if (!ts) {
      return undefined
    }
    if (ts.folderParent) {
      return rootTabsetFor(useTabsetsStore().getTabset(ts.folderParent))
    }
    return ts
  }

  const saveTabset = async (tabset: Tabset, changeInfo?: ChangeInfo): Promise<any> => {
    if (tabset.id) {
      tabset.updated = new Date().getTime()
      // seems necessary !?
      if (!tabset.type) {
        tabset.type = TabsetType.DEFAULT
      }
      const rootTabset = rootTabsetFor(tabset)
      //console.debug(`saving (sub-)tabset '${tabset.name}' with ${tabset.tabs.length} tab(s) at id ${rootTabset?.id}`)
      if (rootTabset) {
        return await useTabsetsStore().saveTabset(rootTabset, changeInfo)
      }
    }
    return Promise.reject('tabset id not set')
  }

  const addToTabsetId = async (tsId: string, tab: Tab, useIndex: number | undefined = undefined): Promise<Tabset> => {
    const ts = useTabsetsStore().getTabset(tsId)
    if (ts) {
      return addToTabset(ts, tab, useIndex)
    }
    return Promise.reject('no tabset for given id ' + tsId)
  }

  const saveCurrentTabset = async (changeInfo?: ChangeInfo): Promise<any> => {
    const currentTabset = useTabsetsStore().getCurrentTabset
    if (currentTabset) {
      return await saveTabset(currentTabset, changeInfo)
    }
    return Promise.reject('current tabset could not be found')
  }

  /**
   * called when we have a text excerpt (and meta data) from the background script.
   *
   * The data (text & meta) will be saved in the content db with an identifier derived from
   * the url - this data will be saved even if there is no tab for this url yet.
   *
   * Then, all existing tabs for the same url will be updated with the new data.
   *
   * @param tab
   * @param text
   * @param metas
   */
  const saveText = (tab: Tab | undefined, text: string, metas: object = {}): Promise<any> => {
    if (!tab || !tab.url) {
      return Promise.resolve('done')
    }
    console.debug('saving text for', tab.id, tab.url, metas)
    const title = tab.title || ''
    const tabsetIds: string[] = tabsetsFor(tab.url)

    const candidates = _.map(
      _.filter(
        [...useTabsetsStore().tabsets.values()],
        (ts: Tabset) => ts.type === TabsetType.DEFAULT || ts.type === TabsetType.SESSION,
      ),
      (ts: Tabset) => {
        return { name: ts.name, id: ts.id }
      },
    )

    // try to apply AI logic
    if (useFeaturesStore().hasFeature(FeatureIdent.AI)) {
      const matchAgainst = title + '; ' + tab.url + '; ' + text || ''
      const data = {
        text: matchAgainst,
        candidates: _.map(candidates, (c: any) => c.name),
      }
      console.log('about to apply KI logic on meta description...', data)
      //sendMsg('zero-shot-classification', data)

      chrome.runtime.sendMessage(
        {
          name: 'zero-shot-classification',
          data: data,
        },
        (callback: any) => {
          console.log('got callback!', callback)
          if (chrome.runtime.lastError) {
            /* ignore */
          }
          const tabsetScores: object[] = []
          // if (callback.scores) {
          //   callback.scores.forEach((score: number, index: number) => {
          //     console.log("got score", score)
          //     if (score > .1) {
          //       tabsetScores.push({
          //         score: score,
          //         candidateName: candidates[index].name,
          //         candidateId: candidates[index].id
          //       })
          //     }
          //   })
          //   // force reload in other pages (like CurrentTabElementHelper)
          //   // TODO check
          //   //useTabsStore().setCurrentChromeTab(tab)
          // }
        },
      )
    }

    useContentService()
      .saveContent(tab.id, tab.url, text, metas, title, tabsetIds)
      .catch((err: any) => console.log('err', err))

    const tabsets = [...useTabsetsStore().tabsets.values()] as Tabset[]

    const savePromises: Promise<any>[] = []

    // iterate all tabsets and update meta data for given url
    tabsets.forEach((tabset: Tabset) => {
      if (tabset) {
        _.forEach(tabset.tabs, (t: Tab) => {
          //console.log("comparing", t.url, tab.url)
          if (t.url === tab.url) {
            if (metas && metas['description' as keyof object]) {
              t.description = metas['description' as keyof object]
              // TODO
              //useSearchStore().update(tab.url, 'description', t.description)
            }
            if (metas && metas['tabsets:longDescription' as keyof object]) {
              t.longDescription = metas['tabsets:longDescription' as keyof object]
            }
            if (metas && metas['keywords' as keyof object]) {
              t.keywords = metas['keywords' as keyof object]
              if (t.keywords) {
                const blankSeparated = t.keywords.split(' ')
                const commaSeparated = t.keywords.split(',')
                const splits = t.keywords.indexOf(',') >= 0 ? commaSeparated : blankSeparated
                if (!t.tags) {
                  t.tags = []
                }
                Tab.addTags(t, splits)
                // t.tags = t.tags.concat(
                //   _.union(
                //     _.filter(
                //       _.map(splits, (split: any) => split.trim()),
                //       (split: string) => split.length > 0,
                //     ),
                //   ),
                // )
              }
            }
            const author = getIfAvailable(metas, 'author')
            if (author) {
              t.author = author
            }
            const lastModified = getIfAvailable(metas, 'last-modified')
            if (lastModified) {
              t.lastModified = lastModified
            }
            const date = getIfAvailable(metas, 'date')
            if (date) {
              t.date = date
            }
            const image = getIfAvailable(metas, 'image')
            if (image) {
              t.image = image
            }

            if (text && text.length > 0) {
              t.contentHash = uuidv5(text, 'da42d8e8-2afd-446f-b72e-8b437aa03e46')
            } else {
              t.contentHash = ''
            }
            savePromises.push(saveTabset(tabset))
          }
        })
      }
    })

    return Promise.all(savePromises)
  }

  const saveLinksFor = (tab: chrome.tabs.Tab, links: any) => {
    if (tab && tab.url) {
      // db.saveLinks(tab.url, links)
      //   //.then(() => console.debug("added links"))
      //   .catch(err => console.log("err", err))
    }
  }

  const tabsetsFor = (url: string): string[] => {
    const tabsets: string[] = []
    for (let ts of [...useTabsetsStore().tabsets.values()]) {
      if (ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE) {
        if (_.find(ts.tabs, (t: any) => t.url === url)) {
          tabsets.push(ts.id)
        }
      }
    }
    return tabsets
  }

  const exportDataAsJson = () => {
    const tabsets = [...useTabsetsStore().tabsets.values()] as Tabset[]
    return JSON.stringify(
      {
        tabsets: tabsets.filter((ts: Tabset) => ts.status !== TabsetStatus.DELETED),
        spaces: [...useSpacesStore().spaces.values()],
      },
      null,
      2,
    )
  }

  /**
   * adds the (new) Tab 'tab' to the tabset given in 'ts' (- but does not persist to db).
   *
   * proceeds only if tab.url exists and the tab is not already contained in the tabset (if allowDuplicates is false)
   *
   * @param ts The Tabset to add to
   * @param tab the tab being added
   * @param useIndex
   * @param allowDuplicates
   */
  const addToTabset = async (
    ts: Tabset,
    tab: Tab,
    useIndex: number | undefined = undefined,
    allowDuplicates = false, // used eg at Excalidraw Handler
  ): Promise<Tabset> => {
    const reject: string | undefined = await checkAddToTabsetConstraints(ts, tab, allowDuplicates)
    if (reject) {
      return Promise.reject(reject)
    }

    handleTags(ts, tab)
    addToTabsetWithIndex(ts, tab, useIndex)

    if (LocalStorage.getItem(GITHUB_AUTO_SYNC) && !LocalStorage.getItem(GITHUB_AUTO_SYNC_READONLY)) {
      useCommandExecutor()
        .execute(
          new GithubWriteEventCommand(
            new TabEvent('added', ts.id, tab.id, tab.name || tab.title || '', tab.url, tab.favIconUrl),
          ),
        )
        .catch((err) => console.warn(err))
    }

    return Promise.resolve(ts)
  }

  const saveBlob = (tab: chrome.tabs.Tab | undefined, blob: Blob): Promise<string> => {
    // if (tab && tab.url) {
    //   const id: string = uid()
    //   return db.saveBlob(id, tab.url, blob, BlobType.PNG, '')
    //     .then(() => Promise.resolve(id))
    //     .catch(err => Promise.reject(err))
    // }
    return Promise.reject('no tab or tab url')
  }

  const getBlob = (blobId: string): Promise<any> => {
    return Promise.reject('not implemented P') //db.getBlob(blobId)
  }

  // const saveRequestFor = (url: string, requestInfo: RequestInfo) => {
  //   if (url) {
  //     db.saveRequest(url, requestInfo)
  //       .then(() => console.debug("added request"))
  //       .catch(err => console.log("err", err))
  //   }
  // }

  const removeContentFor = (tabId: string): Promise<any> => {
    return useContentService().deleteContent(tabId)
  }

  const deleteTab = async (tab: Tab, tabset: Tabset, skipSync = false): Promise<Tabset> => {
    console.log('deleting tab', tab) //.id, tab.chromeTabId, tabset.id)
    const tabUrl = tab.url || ''
    if (tabsetsFor(tabUrl).length <= 1) {
      AppEventDispatcher.dispatchEvent('remove-captured-screenshot', {
        tabId: tab.id,
      })

      removeContentFor(tab.id)
        .then(() => console.debug('deleting content for ', tab.id))
        .catch((err) => console.log('error deleting content', err))
    }
    useTabsStore2().removeTab(tabset, tab.id)
    console.log('deletion: saving tabset', tabset)
    const result = saveTabset(tabset, new ChangeInfo('tab', 'deleted', tab.id)).then(() => tabset)

    if (!skipSync) {
      useCommandExecutor()
        .execute(
          new GithubWriteEventCommand(
            new TabEvent('deleted', tabset.id, tab.id, tab.name || '', 'url: xxx', tab.favIconUrl),
          ),
        )
        .catch((err) => console.warn(err))
    }

    return result
  }

  const getIfAvailable = (metas: object, key: string): string | undefined => {
    let res = undefined
    _.forEach(Object.keys(metas), (k: any) => {
      const value = metas[k as keyof object] as string
      if (k.endsWith(key) && value && value.trim().length > 0) {
        //console.log("k>", k, value)
        res = value
      }
    })
    return res
  }

  const urlExistsInATabset = (url: string): boolean => {
    for (let ts of [...useTabsetsStore().tabsets.values()]) {
      if (_.find(ts.tabs, (t: any) => t.url === url)) {
        return true
      }
    }
    return false
  }
  const urlExistsInCurrentTabset = (url: string | undefined, folderId: string | undefined = undefined): boolean => {
    const currentTabset = useTabsetsStore().getCurrentTabset
    if (!currentTabset || !url) {
      return false
    }
    let useTabset = currentTabset
    if (folderId && currentTabset) {
      const folder = useTabsetService().findFolder([currentTabset], folderId)
      if (folder) {
        useTabset = folder
      }
    }
    return useTabset.tabs.findIndex((t: Tab) => (t.matcher ? JsUtils.match(t.matcher, url) : t.url === url)) >= 0
    // console.log("testing exists in current tabset", currentTabset.id, url)
    // if (
    //   _.find(useTabset.tabs, (t: any) => {
    //     return t.matcher ? JsUtils.match(t.matcher, url) : t.url === url
    //   })
    // ) {
    //   return true
    // }
  }

  const urlWasActivated = (url: string | undefined): void => {
    function updatedAfterGraceTime(h: Tab) {
      return new Date().getTime() - h.lastActive > 1000
    }

    if (!url) {
      return
    }

    //console.log('urlWasActivataed', url)
    _.forEach([...useTabsetsStore().tabsets.keys()], (key: string) => {
      const ts = useTabsetsStore().tabsets.get(key)
      if (ts && ts.status !== TabsetStatus.DELETED) {
        // increasing hit count
        const hits = _.filter(ts.tabs, (t: Tab) => t.url === url) as Tab[]
        let hit = false
        _.forEach(hits, (h: Tab) => {
          if (updatedAfterGraceTime(h)) {
            h.activatedCount = 1 + h.activatedCount
            h.lastActive = new Date().getTime()
            hit = true
          }
        })
        if (hit) {
          //console.debug('saving tabset on activated', ts.name)
          saveTabset(ts as Tabset, new ChangeInfo('tabset', 'edited', ts.id)).catch((err: any) => console.warn(err))
        }
      }
    })
  }

  const findFolder = (folders: Tabset[], folderId: string): Tabset | undefined => {
    for (const f of folders || []) {
      if (f.id === folderId) {
        //console.log("found active folder", f)
        return f
      }
      const optionalFound = findFolder(f.folders, folderId)

      if (optionalFound) {
        return optionalFound
      }
    }
    return undefined
  }

  const removeFolder = (root: Tabset, folderId: string): void => {
    root.folders = _.filter(root.folders, (f: any) => f.id !== folderId)
    for (const f of root.folders) {
      removeFolder(f, folderId)
    }
  }

  const findTabInFolder = (folders: Tabset[], tabId: string): TabInFolder | undefined => {
    //console.log(`searching ${tabId}`)
    for (const f of folders) {
      for (const t of f.tabs) {
        if (t.id === tabId) {
          return new TabInFolder(t, f)
        }
      }
    }
    for (const f of folders) {
      if (f.folders) {
        return findTabInFolder(f.folders, tabId)
      }
    }
    return undefined
  }

  // TODO make command
  const moveTabToFolder = (tabset: Tabset, tabIdToDrag: string, moveToFolderId?: string) => {
    console.log(`moving tab ${tabIdToDrag} to folder ${moveToFolderId} in tabset ${tabset.id}`)
    const tabWithFolder = findTabInFolder([tabset], tabIdToDrag)
    console.log('found tabWithFolder', tabWithFolder)
    //const newParentFolder = findFolder([tabset], moveToFolderId)
    const newParentFolder = moveToFolderId ? useTabsetsStore().getActiveFolder(tabset, moveToFolderId) : tabset
    if (newParentFolder && tabWithFolder) {
      console.log('newParentFolder', newParentFolder)
      newParentFolder.tabs.push(tabWithFolder.tab)
      saveTabset(tabset).then(() => {
        tabWithFolder.folder.tabs = _.filter(tabWithFolder.folder.tabs, (t: any) => t.id !== tabIdToDrag)
        saveTabset(tabset)
      })
    }
  }

  const populateSearch = async () => {
    //const urlSet: Set<string> = new Set()
    const minimalIndex: object[] = []

    const contents: ContentItem[] = await useContentService().getContents()

    async function pushToIndex(tabset: Tabset) {
      for (const tab of tabset.tabs) {
        if (!tab.url) {
          continue
        }
        //const content = await useContentService().getContent(tab.id)
        const content = contents.find((item) => item.url === tab.url) || new ContentItem('', '', '', '', [], [])
        const addToIndex = {
          name: tab.name || '',
          title: tab.title || '',
          url: tab.url || '',
          description: tab.description,
          content: content.content || '',
          tabsets: [tabset.id],
          favIconUrl: tab.favIconUrl || '',
          tags: tab.tags && Array.isArray(tab.tags) ? tab.tags.join(' ') : '',
        }
        // console.log("adding", addToIndex)
        minimalIndex.push(addToIndex)
        // console.log("minimalIndex", minimalIndex.length)
      }
      if (!tabset.folders) {
        tabset.folders = []
      }
      tabset.folders.forEach((folder) => {
        pushToIndex(folder)
      })
    }

    for (const tabset of [...useTabsetsStore().tabsets.values()] as Tabset[]) {
      await pushToIndex(tabset)
    }

    //console.debug(` ...populating search index from tabsets with ${minimalIndex.length} entries`)
    const perInterval = 250
    const throttleRequests = throttledQueue(perInterval, 1000, true)

    const promises: Promise<any>[] = []
    let index = 0
    minimalIndex.forEach((doc: object) => {
      const p = throttleRequests(async () => {
        const progress =
          Math.round((100 * (1.1 * ((perInterval * index) / minimalIndex.length) + index++)) / minimalIndex.length) /
          100
        useUiStore().setProgress(progress, 'indexing search...')
        AppEventDispatcher.dispatchEvent('upsert-in-search', doc)
        return Promise.resolve('')
      })
      promises.push(p)
    })
    Promise.all(promises).finally(() => useUiStore().stopProgress())

    // adding content in a second round
    // useContentService().getContents()
    //   .then((contents: ContentItem[]) => {
    //
    //     useSearchStore().
    //
    //     contents.forEach(content => {
    //       const addToIndex = {
    //         name: content.name || '',
    //         title: content.title || '',
    //         url: content.url || '',
    //         description: content.description,
    //         content: content?.content || '',
    //         tabsets: [tabset.id],
    //         favIconUrl: content.favIconUrl || '',
    //         tags: content.tags ? content.tags.join(' ') : ''
    //       }
    //     })
    //   })
  }

  const addToSearchIndex = (tsId: string, tabs: Tab[]) => {
    const minimalIndex: object[] = []
    const urlSet: Set<string> = new Set()
    tabs.forEach((tab: Tab) => {
      if (tab.url) {
        if (!urlSet.has(tab.url)) {
          //const doc = new SearchDoc("", "", tab.title || '', tab.url, "", "", "", [tsId], '', "")
          minimalIndex.push({
            name: tab.name || '',
            title: tab.title || '',
            url: tab.url || '',
            description: tab.description,
            content: '',
            tabsets: [tsId],
            favIconUrl: tab.favIconUrl || '',
            tags: tab.tags && Array.isArray(tab.tags) ? tab.tags.join(' ') : '',
          })
          urlSet.add(tab.url)
        }
      }
    })
    minimalIndex.forEach((e) => {
      AppEventDispatcher.dispatchEvent('add-to-search', e)
    })
  }

  async function handleResponse(t: Tab, method: string, timeout: number): Promise<number> {
    try {
      const response = await fetch(t.url!, {
        method: method,
        cache: 'no-cache',
        redirect: 'manual',
        signal: AbortSignal.timeout(timeout),
      })

      // just for logging
      const ignoreList = [
        'connection',
        'content-type',
        'content-language',
        'charset',
        'date',
        'pragma',
        'x-content-type-options',
        'keep-alive',
        'last-modified',
        'vary',
        'content-encoding',
        'server',
        'referrer-policy',
        'strict-transport-security',
        'content-length',
        'via',
        'expires',
        'permissions-policy',
        'priority',
        'nel',
        'reporting-endpoints',
        'etag',
        'age',
      ]
      response.headers.forEach((value: string, key: string, parent: Headers) => {
        if (
          ignoreList.indexOf(key) < 0 &&
          !key.startsWith('cf-') &&
          !key.startsWith('x-') &&
          !key.startsWith('alt-') &&
          !key.startsWith('report-') &&
          !key.startsWith('medium-') &&
          !key.startsWith('access-') &&
          !key.startsWith('accept-') &&
          !key.startsWith('origin-') &&
          !key.startsWith('cross-') &&
          !key.startsWith('server-') &&
          !key.startsWith('atl-') &&
          !key.startsWith('expect-') &&
          !key.startsWith('cache-') &&
          !key.startsWith('transfer-') &&
          !key.startsWith('content-security-') &&
          !key.startsWith('worker-')
        ) {
          // hs += key +": " + value
          //console.debug('got header', key + ': ' + value)
        }
      })
      // just for logging - end

      const oldLastModified = t.httpLastModified
      const oldEtag = t.httpEtag

      t.httpStatus = response.status
      t.httpContentType = response.headers.get('content-type') || 'unknown'
      t.httpLastModified = response.headers.get('last-modified') || 'unknown'
      t.httpExpires = response.headers.get('expires')?.toString() || 'unknown'
      t.httpEtag = response.headers.get('etag')?.toString() || ''
      t.httpCheckedAt = new Date().getTime()

      if (t.httpStatus >= 200 && t.httpStatus < 300) {
        t.httpInfo = ''
      }

      if (response.status >= 301 && response.status <= 399) {
        console.log(`checking HEAD found status ${response.status} for url ${t.url}`)
        t.httpInfo = 'REDIRECTED'
      }
      if (method === 'GET' && response.status > 200) {
        console.log('got t>>>', response.status, t)
      }
      try {
        if (t.httpLastModified && oldLastModified) {
          if (Date.parse(t.httpLastModified) > Date.parse(oldLastModified)) {
            t.httpInfo = 'UPDATED'
          }
        }
      } catch (err) {}
      if (t.httpEtag && oldEtag && t.httpEtag !== oldEtag) {
        t.httpInfo = 'UPDATED'
      }
      return t.httpStatus
    } catch (error: any) {
      //console.debug('got a Problem fetching url "' + t.url + '": \n', error)
      t.httpStatus = 404
      t.httpCheckedAt = new Date().getTime()
      t.httpError = error.toString()
    }
    if (t.httpStatus === 0 || t.httpStatus >= 300) {
      //console.log(`result status for ${t.url}: ${t.httpStatus}, info: ${t.httpInfo}, error: ${t.httpError}`)
    }
    return t.httpStatus
  }

  const handleHeadRequests = async (selectedTabset: Tabset, folderId: string | undefined) => {
    const useTabset = folderId ? useTabsetsStore().getActiveFolder(selectedTabset, folderId) : selectedTabset
    if (!useTabset) {
      console.log(`could not determine tabset for ${selectedTabset.id}, folder ${folderId}`)
      return
    }
    if (!useUiStore().networkOnline) {
      console.log('not checking HEAD requests due to network offline')
      return
    }
    const networkState = useUiStore().networkState
    if (networkState && networkState['rtt' as keyof object]) {
      if (networkState['rtt' as keyof object] > 500) {
        console.log('no HEAD request check due to bad network:', networkState)
      }
    }

    //console.log(`checking current urls using HEAD requests for tabset ${selectedTabset.id}, folder ${folderId}`)
    let missed = 0
    for (const t of useTabset.tabs) {
      throttleOne50Millis(async () => {
        const oldEnough = t.httpCheckedAt ? new Date().getTime() - t.httpCheckedAt > 1000 * 60 : true // 1min
        if (t.url && !t.url.startsWith('chrome') && oldEnough) {
          var status = await handleResponse(t, 'HEAD', 1500)
          if (status === 0 || status === 404) {
            missed++
            //console.log("===>>>", useTabset.tabs.length, missed )
            if (useTabset.tabs.length > 5 && missed / useTabset.tabs.length >= 0.5) {
              missed = 0
              useUiStore().checkConnection()
              setTimeout(() => {
                useUiStore().checkConnection()
              }, 1000 * 60)
            }
          }
          if (status === 0) {
            handleResponse(t, 'GET', 5000)
          }
        }
      }).then(() => {})
    }

    await useTabsetService().saveTabset(selectedTabset)
  }

  /**
   * renames a tabset identified by its id with the new name. The old name
   * is returned.
   *
   * @param tabsetId
   * @param tabsetName
   */
  const rename = (
    tabsetId: string,
    tabsetName: string,
    newColor: string | undefined,
    window: string = 'current',
  ): Promise<object> => {
    const trustedName = tabsetName.replace(STRIP_CHARS_IN_USER_INPUT, '')
    let trustedColor = newColor ? newColor.replace(STRIP_CHARS_IN_COLOR_INPUT, '') : undefined
    trustedColor = trustedColor && trustedColor.length > 20 ? trustedColor?.substring(0, 19) : trustedColor

    const tabset = useTabsetsStore().getTabset(tabsetId)
    if (tabset) {
      const oldName = tabset.name
      const oldColor = tabset.color
      tabset.name = trustedName
      tabset.color = trustedColor
      tabset.window = window
      //console.log("saving tabset", tabset)
      return saveTabset(tabset).then(() =>
        Promise.resolve({
          oldName: oldName,
          oldColor: oldColor,
        }),
      )
    }
    return Promise.reject('could not find tabset for id ' + tabsetId)
  }

  const markAs = (
    tabsetId: string,
    status: TabsetStatus,
    type: TabsetType = TabsetType.DEFAULT,
  ): Promise<TabsetStatus> => {
    console.debug(`marking ${tabsetId} as ${status}`)
    const ts = useTabsetsStore().getTabset(tabsetId)
    if (ts) {
      const oldStatus = ts.status
      ts.status = status
      ts.type = type
      return saveTabset(ts).then(() => oldStatus)
    }
    return Promise.reject('could not change status : ' + tabsetId)
  }

  const nameForTabsetId = (tsId: string): string => {
    return useTabsetsStore().tabsets.get(tsId)?.name || 'unknown'
  }

  const limitExceeded = async () => {
    const exceedInfo = useAuthStore().limitExceeded('TABS', useTabsetsStore().allTabsCount)
    if (exceedInfo.exceeded) {
      await useNavigationService().browserTabFor(
        chrome.runtime.getURL(
          `/www/index.html#/mainpanel/settings?tab=account&exceeded=tabs&limit=${exceedInfo.limit}`,
        ),
      )
      return true
    }
    return false
  }

  const checkAddToTabsetConstraints = async (
    ts: Tabset,
    tab: Tab,
    allowDuplicates: boolean,
  ): Promise<string | undefined> => {
    if (!tab.url) {
      return Promise.resolve('tab.url undefined')
    }
    if (await limitExceeded()) {
      return Promise.resolve('Tabs Limit was Exceeded')
    }
    if (!allowDuplicates) {
      const indexInTabset = _.findIndex(ts.tabs, (t: any) => t.url === tab.url)
      if (indexInTabset >= 0) {
        return Promise.resolve('tab exists already')
      }
    }
    return Promise.resolve(undefined)
  }

  const handleTags = (ts: Tabset, tab: Tab) => {
    Tab.addTags(tab, [ts.name])
    try {
      Tab.addTags(tab, [new URL(tab.url!).hostname.replace('www.', '')])
    } catch (err) {
      // ignore
    }
  }

  const addToTabsetWithIndex = (ts: Tabset, tab: Tab, useIndex: number | undefined) => {
    if (useIndex !== undefined && useIndex >= 0) {
      ts.tabs.splice(useIndex, 0, tab)
    } else {
      ts.tabs.push(tab)
    }
  }

  return {
    init,
    saveOrReplaceFromChromeTabs,
    saveOrReplaceFromBookmarks,
    copyFromTabset,
    deleteFromTabset,
    deleteTabset,
    selectTabset,
    saveTabset,
    saveCurrentTabset,
    saveText,
    saveLinksFor,
    addToTabsetId,
    addToTabset,
    tabsetsFor,
    removeContentFor,
    deleteTab,
    urlExistsInATabset,
    urlExistsInCurrentTabset,
    saveBlob,
    getBlob,
    reloadTabset,
    deleteTabsetDescription,
    findTabInFolder,
    moveTabToFolder,
    deleteTabsetFolder,
    urlWasActivated,
    populateSearch,
    addToSearchIndex,
    exportDataAsJson,
    findFolder,
    handleHeadRequests,
    rename,
    markAs,
    nameForTabsetId,
  }
}
