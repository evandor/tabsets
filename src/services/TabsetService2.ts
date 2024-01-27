import {STRIP_CHARS_IN_COLOR_INPUT, STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import {uid} from "quasar";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useSearchStore} from "src/stores/searchStore";
import ChromeApi from "src/services/ChromeApi";
import {TabPredicate} from "src/domain/Types";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {MetaLink} from "src/models/MetaLink";
import {SpecialTabsetIdent} from "src/domain/tabsets/CreateSpecialTabset";
// @ts-ignore
import {v5 as uuidv5} from 'uuid';
import {useSettingsStore} from "src/stores/settingsStore"
import {Space} from "src/models/Space";
import {useSpacesStore} from "src/stores/spacesStore";
import {SaveOrReplaceResult} from "src/models/SaveOrReplaceResult";
import PersistenceService from "src/services/PersistenceService";
import JsUtils from "src/utils/JsUtils";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {RequestInfo} from "src/models/RequestInfo";
import {DynamicTabSourceType} from "src/models/DynamicTabSource";
import {useUiStore} from "stores/uiStore";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {Suggestion, SuggestionState, SuggestionType} from "src/models/Suggestion";
import {MonitoringType} from "src/models/Monitor";
import {BlobType} from "src/models/SavedBlob";
import MqttService from "src/services/mqtt/MqttService";
import {useRouter} from "vue-router";
import tabsetService from "src/services/TabsetService";
import TabsetService from "src/services/TabsetService";
import {TabInFolder} from "src/models/TabInFolder";

let db: PersistenceService = null as unknown as PersistenceService

export function useTabsetService() {

  const init = async (providedDb: PersistenceService,
                      doNotInitSearchIndex: boolean = false) => {
    console.log("initializing tabsetService2")
    db = providedDb

    useTabsStore().clearTabsets()

    await db.loadTabsets()
    if (!doNotInitSearchIndex) {
      useSearchStore().populateFromContent(db.getContents())
      useSearchStore().populateFromTabsets()
    }

    // check TODO!
    const selectedTS = localStorage.getItem("selectedTabset")
    if (selectedTS) {
      console.debug("setting selected tabset from storage", selectedTS)
      useTabsStore().selectCurrentTabset(selectedTS)
    }

    ChromeApi.buildContextMenu()

    useTabsStore().tabsets.forEach(ts => {
      if (ts.sharedId) {
        console.log("subscribing to topic ", ts.sharedId)
        MqttService.subscribe(ts.sharedId)
      }
    })
  }

  /**
   * Will create a new tabset (or update an existing one with matching name) from
   * the provided Chrome tabs.
   *
   * Use case: https://skysail.atlassian.net/wiki/spaces/TAB/pages/807927852/Creating+a+Tabset
   *
   * The tabset is created or updated in the store, and the new data is persisted.
   * If merge is false, potentially existing tabs will be removed first.
   *
   * @param name the tabset's name
   * @param chromeTabs an array of Chrome tabs
   * @param merge if true, the old values (if existent) and the new ones will be merged.
   * @param type
   */
  const saveOrReplaceFromChromeTabs = async (
    name: string,
    chromeTabs: chrome.tabs.Tab[],
    merge: boolean = false,
    windowId: string = 'current',
    tsType: TabsetType = TabsetType.DEFAULT,
    color: string | undefined = undefined
  ): Promise<SaveOrReplaceResult> => {

    const trustedName = name.replace(STRIP_CHARS_IN_USER_INPUT, '')
      .substring(0, 31)
    const trustedColor = color ?
      color.replace(STRIP_CHARS_IN_COLOR_INPUT, '').substring(0, 31)
      : undefined
    const tabs: Tab[] = _.filter(
      _.map(chromeTabs, t => {
        const tab = new Tab(uid(), t)
        tab.tags.push(name)
        return tab
      }),
      (t: Tab) => {
        if (!useSettingsStore().isEnabled('extensionsAsTabs')) {
          return !t.url?.startsWith("chrome-extension://")
        }
        return true
      })
    try {
      const result: NewOrReplacedTabset = await useTabsStore()
        .updateOrCreateTabset(trustedName, tabs, merge, windowId, tsType, trustedColor)
      if (result && result.tabset) {
        await saveTabset(result.tabset)
        // result.tabset.tabs.forEach((tab: Tab) => {
        //   console.info(tab, "created tab")
        // })
        selectTabset(result.tabset.id)
        useSearchStore().indexTabs(result.tabset.id, tabs)
        return new SaveOrReplaceResult(result.replaced, result.tabset, merge)

      }
      return Promise.reject("could not update or create tabset")
    } catch (err) {
      return Promise.reject("problem updating or creating tabset: " + err)
    }
  }

  const copyFromTabset = async (tabset: Tabset, space: Space): Promise<object> => {

    function nameFrom(name: string): string {
      const nameCandidate = name + " - Copy"
      const existsAlready = useTabsStore().existingInTabset(nameCandidate, useSpacesStore().space)
      return existsAlready ? nameFrom(nameCandidate) : nameCandidate.replace(STRIP_CHARS_IN_USER_INPUT, '')
    }

    const copyName = nameFrom(tabset.name)
    try {
      const result: NewOrReplacedTabset = await useTabsStore().updateOrCreateTabset(copyName, tabset.tabs)
      if (result && result.tabset) {
        if (space) {
          tabset.spaces = [space.id]
        } else {
          tabset.spaces = []
        }
        await saveTabset(result.tabset)
        selectTabset(result.tabset.id)
        useSearchStore().indexTabs(result.tabset.id, result.tabset.tabs)
        return {
          replaced: false,
          tabset: result.tabset,
          merged: false
        }
      }
      return Promise.reject("could not copy tabset")
    } catch (err) {
      return Promise.reject("problem copying tabset: " + err)
    }
  }

  // @ts-ignore
  const getOrCreateSpecialTabset = async (ident: SpecialTabsetIdent, type: TabsetType): Tabset => {
    const result: Tabset = await useTabsStore().getOrCreateSpecialTabset(ident, type)
    await saveTabset(result)
    return result
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
  const saveOrReplaceFromBookmarks = async (name: string, bms: chrome.bookmarks.BookmarkTreeNode[], merge: boolean = false, dryRun = false): Promise<object> => {
    const tabsStore = useTabsStore()
    const now = new Date().getTime()
    const tabs = _.map(_.filter(bms, bm => bm.url !== undefined), c => {
      const tab = new Tab(uid(), ChromeApi.createChromeTabObject(c.title, c.url || '', ""))
      tab.bookmarkUrl = c.url
      tab.bookmarkId = c.id
      tab.created = c.dateAdded || 0
      tab.updated = now
      return tab
    })

    const result = await tabsStore.updateOrCreateTabset(name, tabs, merge)
    if (result && result.tabset) {
      if (!dryRun) {
        await saveTabset(result.tabset)
        selectTabset(result.tabset.id)
      }
      return {
        tabsetId: result.tabset.id,
        replaced: result.replaced,
        merged: merge,
        updated: now,
        tabset: result.tabset
      }
    }
    return Promise.reject("could not import from bookmarks")
  }

  const getTabset = (tabsetId: string): Tabset | undefined => {
    const tabsStore = useTabsStore()
    return _.find([...tabsStore.tabsets.values()] as Tabset[], ts => ts.id === tabsetId)
  }

  const reloadTabset = async (tabsetId: string) => {
    return db.reloadTabset(tabsetId)
  }

  const getCurrentTabset = (): Tabset | undefined => {
    const tabsStore = useTabsStore()
    return tabsStore.tabsets.get(tabsStore.currentTabsetId) as Tabset
  }

  const resetSelectedTabs = () => {
    // const currentTabset = getCurrentTabset()
    // if (currentTabset) {
    //   _.forEach(currentTabset.tabs, (t: Tab) => t.selected = false)
    // }
    // useNotificationsStore().setSelectedTab(null as unknown as Tab)
  }

  const selectTabset = (tabsetId: string | undefined): void => {
    console.debug("selecting tabset", tabsetId)
    const tabsStore = useTabsStore()
    resetSelectedTabs()
    tabsStore.currentTabsetId = tabsetId || null as unknown as string;
    if (tabsetId) {
      localStorage.setItem("selectedTabset", tabsetId)
    } else {
      localStorage.removeItem("selectedTabset")
    }
  }

  const removeThumbnailsFor = (url: string): Promise<any> => {
    return db.deleteThumbnail(url)
  }

  const deleteTabset = (tabsetId: string): Promise<string> => {
    const tabset = getTabset(tabsetId)
    if (tabset) {
      const tabsStore = useTabsStore()
      _.forEach(tabsStore.getTabset(tabsetId)?.tabs, (t: Tab) => {
        console.debug(t, "removing thumbnails")
        removeThumbnailsFor(t?.url || '')
      })
      tabsStore.deleteTabset(tabsetId)
      db.deleteTabset(tabsetId)
      //this.db.delete('tabsets', tabsetId)
      const nextKey: string = tabsStore.tabsets.keys().next().value
      console.log("setting next key to", nextKey)
      selectTabset(nextKey)
      return Promise.resolve("ok")
    }
    return Promise.reject("could not get tabset for id")
  }

  const deleteTabsetDescription = (tabsetId: string): Promise<string> => {
    const tabset = getTabset(tabsetId)
    if (tabset) {
      tabset.page = undefined
      useTabsetService().saveTabset(tabset)
      return Promise.resolve("done")
    }
    return Promise.reject("could not get tabset for id")
  }

  const deleteFromTabset = (tabsetId: any, predicate: TabPredicate): Promise<number> => {
    console.log("deleting from tabset")
    const ts = useTabsStore().getTabset(tabsetId)
    if (ts) {
      const tabsCount = ts.tabs.length
      const tabsToKeep: Tab[] = _.filter(ts.tabs, (t: Tab) => !predicate(t))
      console.debug("found tabsToKeep", tabsToKeep)
      ts.tabs = tabsToKeep
      return saveTabset(ts)
        .then((res) => tabsCount - tabsToKeep.length)
    }
    return Promise.reject("did not find tabset for id " + tabsetId)

  }

  const rootTabsetFor = (ts: Tabset | undefined): Tabset | undefined => {
    if (!ts) {
      return undefined
    }
    if (ts.folderParent) {
      return rootTabsetFor(getTabset(ts.folderParent))
    }
    return ts
  }

  const saveTabset = async (tabset: Tabset): Promise<any> => {
    if (tabset.id) {
      tabset.updated = new Date().getTime()
      // seems necessary !?
      if (!tabset.type) {
        tabset.type = TabsetType.DEFAULT
      }
      const additionalInfo = _.map(tabset.tabs, t => t.monitor)
      const rootTabset = rootTabsetFor(tabset)
      console.debug(`saving (sub-)tabset '${tabset.name}' with ${tabset.tabs.length} tab(s) at id ${rootTabset?.id}`)
      if (rootTabset) {
        return db.saveTabset(rootTabset)
      }
    }
    return Promise.reject("tabset id not set")
  }

  const addToTabsetId = async (tsId: string, tab: Tab, useIndex: number | undefined = undefined): Promise<Tabset> => {
    const ts = getTabset(tsId)
    if (ts) {
      return addToTabset(ts, tab, useIndex)
    }
    return Promise.reject("no tabset for given id " + tsId)
  }


  const saveCurrentTabset = (): Promise<any> => {
    const tabsStore = useTabsStore()
    const currentTabset = tabsStore.getCurrentTabset
    if (currentTabset) {
      //console.log("saving current tabset", currentTabset)
      return saveTabset(currentTabset)
    }
    return Promise.reject("current tabset could not be found")
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
  const saveText = (tab: Tab | undefined, text: string, metas: object): Promise<any> => {
    if (!tab || !tab.url) {
      return Promise.resolve('done')
    }
    console.debug("saving text for", tab.id, tab.url)
    const title = tab.title || ''
    const tabsetIds: string[] = tabsetsFor(tab.url)

    db.saveContent(tab, text, metas, title, tabsetIds)
      .catch((err: any) => console.log("err", err))

    const tabsets = [...useTabsStore().tabsets.values()] as Tabset[]

    const savePromises: Promise<any>[] = []

    // iterate all tabsets and update meta data for given url
    tabsets.forEach((tabset: Tabset) => {
      if (tabset) {
        _.forEach(tabset.tabs, (t: Tab) => {
          //console.log("comparing", t.url, tab.url)
          if (t.url === tab.url) {
            if (metas['description' as keyof object]) {
              t.description = metas['description' as keyof object]
              // @ts-ignore
              useSearchStore().update(tab.url, 'description', t.description)
            }
            if (metas['tabsets:longDescription' as keyof object]) {
              t.longDescription = metas['tabsets:longDescription' as keyof object]
            }
            if (metas['keywords' as keyof object]) {
              t.keywords = metas['keywords' as keyof object]
              if (t.keywords) {
                const blankSeparated = t.keywords.split(" ")
                const commaSeparated = t.keywords.split(",")
                const splits = (t.keywords.indexOf(",") >= 0) ? commaSeparated : blankSeparated
                if (!t.tags) {
                  t.tags = []
                }
                t.tags = t.tags.concat(_.union(_.filter(_.map(splits, (split) => split.trim()), (split: string) => split.length > 0)))
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

            const oldContentHash = t.contentHash
            if (text && text.length > 0) {
              t.contentHash = uuidv5(text, 'da42d8e8-2afd-446f-b72e-8b437aa03e46')
            } else {
              t.contentHash = ""
            }
            if (usePermissionsStore().hasFeature(FeatureIdent.MONITORING) &&
              t.monitor && t.monitor.type === MonitoringType.CONTENT_HASH) {
              if (oldContentHash && oldContentHash !== '' &&
                t.contentHash !== oldContentHash &&
                t.contentHash !== '' && t.url) {

                console.log("%ccontenthash changed for", "color:yellow", t.url)

                const id = btoa(t.url)
                const msg = "Info: Something might have changed in '" + (t.name ? t.name : t.title) + "'."
                const suggestion = new Suggestion(id, 'Content Change Detected',
                  msg,
                  t.url, SuggestionType.CONTENT_CHANGE)
                suggestion.setData({url: t.url, tabId: t.id})
                suggestion.state = SuggestionState.NOTIFICATION
                useSuggestionsStore().addSuggestion(suggestion)
                  .then(() => {
                    if (usePermissionsStore().hasFeature(FeatureIdent.NOTIFICATIONS)) {
                      chrome.notifications.create(id, {
                        title: "Tabset Extension Message",
                        type: "basic",
                        iconUrl: chrome.runtime.getURL("www/favicon.ico"),
                        message: msg,
                        buttons: [{title: 'show'}, {title: 'ignore'}]
                      }, (callback: any) => {
                        //console.log("got callback", callback)
                      })
                      //useSuggestionsStore().updateSuggestionState(id, SuggestionState.NOTIFICATION)
                    }
                  })
                  .catch((err) => {
                    console.debug("got error", err)
                  })
              }
            }

            savePromises.push(saveTabset(tabset))
          }
        })
      }
    })

    return Promise.all(savePromises)
  }

  const saveMetaLinksFor = (tab: chrome.tabs.Tab, metaLinks: MetaLink[]) => {
    if (tab && tab.url) {
      db.saveMetaLinks(tab.url, metaLinks)
        //.then(() => console.debug("added meta links"))
        .catch(err => console.log("err", err))
    }
  }

  const saveLinksFor = (tab: chrome.tabs.Tab, links: any) => {
    if (tab && tab.url) {
      db.saveLinks(tab.url, links)
        //.then(() => console.debug("added links"))
        .catch(err => console.log("err", err))
    }
  }


  const tabsetsFor = (url: string): string[] => {
    const tabsets: string[] = []
    for (let ts of [...useTabsStore().tabsets.values()]) {
      if (ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE) {
        if (_.find(ts.tabs, t => t.url === url)) {
          tabsets.push(ts.id)
        }
      }
    }
    return tabsets;
  }

  const tabsetFor = (id: string): Tabset | undefined => {
    let tabset: Tabset | undefined = undefined
    for (let ts of [...useTabsStore().tabsets.values()]) {
      if (_.find(ts.tabs, t => t.id === id)) {
        tabset = ts as Tabset
      }
    }
    return tabset
  }

  /**
   * adds the (new) Tab 'tab' to the tabset given in 'ts' (- but does not persist to db).
   *
   * proceeds only if tab.url exists and the tab is not already contained in the tabset.
   *
   * @param ts
   * @param tab
   * @param useIndex
   */
  const addToTabset = async (ts: Tabset, tab: Tab, useIndex: number | undefined = undefined): Promise<Tabset> => {
    if (tab.url) {
      const indexInTabset = _.findIndex(ts.tabs, t => t.url === tab.url)
      if (indexInTabset >= 0 && !tab.image) {
        return Promise.reject("tab exists already")
      }

      // add tabset's name to tab's tags
      tab.tags.push(ts.name)
      try {
        tab.tags.push(new URL(tab.url).hostname.replace("www.", ""))
      } catch (err) {
      }

      if (useIndex !== undefined && useIndex >= 0) {
        ts.tabs.splice(useIndex, 0, tab)
      } else {
        ts.tabs.push(tab)
      }
      // return saveTabset(ts)
      //   .then(() => Promise.resolve(0)) // TODO
      return Promise.resolve(ts)
    }
    return Promise.reject("tab.url undefined")
  }

  const saveThumbnailFor = (tab: chrome.tabs.Tab | undefined, thumbnail: string) => {
    if (tab && tab.url) {
      db.saveThumbnail(tab, thumbnail)
        //.then(() => console.log("added thumbnail"))
        .catch(err => console.log("err", err))
    }
  }

  const saveBlob = (tab: chrome.tabs.Tab | undefined, blob: Blob): Promise<string> => {
    if (tab && tab.url) {
      const id: string = uid()
      return db.saveBlob(id, tab.url, blob, BlobType.PNG, '')
        .then(() => Promise.resolve(id))
        .catch(err => Promise.reject(err))
    }
    return Promise.reject("no tab or tab url")
  }

  const getBlob = (blobId: string): Promise<any> => {
    return Promise.reject("not implemented")//db.getBlob(blobId)
  }

  const saveRequestFor = (url: string, requestInfo: RequestInfo) => {
    if (url) {
      db.saveRequest(url, requestInfo)
        .then(() => console.debug("added request"))
        .catch(err => console.log("err", err))
    }
  }


  const removeContentFor = (url: string): Promise<any> => {
    return db.deleteContent(url)
  }


  const deleteTab = (tab: Tab): Promise<Tabset> => {
    console.log("deleting tab", tab.id, tab.chromeTabId)
    const tabUrl = tab.url || ''
    if (tabsetsFor(tabUrl).length <= 1) {
      removeThumbnailsFor(tabUrl)
        .then(() => console.debug("deleting thumbnail for ", tabUrl))
        .catch(err => console.log("error deleting thumbnail", err))

      removeContentFor(tabUrl)
        .then(() => console.debug("deleting content for ", tabUrl))
        .catch(err => console.log("error deleting content", err))
    }
    const tabset = tabsetFor(tab.id)
    if (tabset) {
      useTabsStore().removeTab(tabset, tab.id)
      //useNotificationsStore().unsetSelectedTab()
      console.log("deletion: saving tabset", tabset)
      return saveTabset(tabset)
        .then(() => tabset)
    }
    return Promise.reject("could not access current tabset")

  }

  const getIfAvailable = (metas: object, key: string): string | undefined => {
    let res = undefined
    _.forEach(Object.keys(metas), k => {
      const value = metas[k as keyof object] as string
      if (k.endsWith(key) && value && value.trim().length > 0) {
        //console.log("k>", k, value)
        res = value
      }
    })
    return res
  }

  const urlExistsInATabset = (url: string): boolean => {
    for (let ts of [...useTabsStore().tabsets.values()]) {
      if (_.find(ts.tabs, t => t.url === url)) {
        return true;
      }
    }
    return false;
  }
  const urlExistsInCurrentTabset = (url: string): boolean => {
    const currentTabset = getCurrentTabset()
    if (currentTabset) {
      if (_.find(currentTabset.tabs, t => {
        return (t.matcher && usePermissionsStore().hasFeature(FeatureIdent.ADVANCED_TAB_MANAGEMENT)) ?
          JsUtils.match(t.matcher, url) :
          t.url === url
      })) {
        return true
      }
    }
    return false;
  }

  const tabsToShow = (tabset: Tabset): Tab[] => {
    if (tabset.type === TabsetType.DYNAMIC &&
      tabset.dynamicTabs && tabset.dynamicTabs.type === DynamicTabSourceType.TAG) {
      const results: Tab[] = []
      //console.log("checking", tabset.dynamicTabs)
      const tag = tabset.dynamicTabs?.config['tags' as keyof object][0]
      //console.log("using tag", tag)
      const tabsets:Tabset[] = [...useTabsStore().tabsets.values()] as Tabset[]
      _.forEach(tabsets, (tabset: Tabset) => {
        _.forEach(tabset.tabs, (tab: Tab) => {
          if (tab.tags?.indexOf(tag) >= 0) {
            results.push(tab)
          }
        })
      })
      //return _.orderBy(results, getOrder(), [orderDesc.value ? 'desc' : 'asc'])
      return results
    }
    let tabs: Tab[] = tabset.tabs


    // TODO order??
    const filter = useUiStore().tabsFilter
    if (!filter || filter.trim() === '') {
      return tabs
    }
    return _.filter(tabs, (t: Tab) => {
      return (t.url || '')?.indexOf(filter) >= 0 ||
        (t.title || '')?.indexOf(filter) >= 0 ||
        t.description?.indexOf(filter) >= 0
    })
  }

  const findFolder = (folders: Tabset[], folderId: string): Tabset | undefined => {
    for (const f of folders) {
      if (f.id === folderId) {
        //console.log("found active folder", f)
        return f
      }
    }
    for (const f of folders) {
      return findFolder(f.folders, folderId)
    }
    return undefined
  }

  const findTabInFolder = (folders: Tabset[], tabId: string): TabInFolder | undefined => {
    for (const f of folders) {
      for (const t of f.tabs) {
        if (t.id === tabId) {
          return new TabInFolder(t,f)
        }
      }
    }
    for (const f of folders) {
      if (f.folders) {
        return findTabInFolder(f.folders, tabId)
      }    }
    return undefined
  }

  // TODO make command
  const moveTabToFolder = (tabset: Tabset, tabIdToDrag: string, moveToFolderId: string) => {
    console.log(`moving tab ${tabIdToDrag} to folder ${moveToFolderId} in tabset ${tabset.id}`)
    const tabWithFolder = findTabInFolder([tabset], tabIdToDrag)
    console.log("found tabWithFolder", tabWithFolder)
    const newParentFolder = findFolder([tabset], moveToFolderId)
    if (newParentFolder && tabWithFolder) {
      console.log("newParentFolder", newParentFolder)
      newParentFolder.tabs.push(tabWithFolder.tab)
      saveTabset(tabset).then(() => {
        tabWithFolder.folder.tabs = _.filter(tabWithFolder.folder.tabs, t => t.id !== tabIdToDrag)
        saveTabset(tabset)
      })
    }
  }


  return {
    init,
    saveOrReplaceFromChromeTabs,
    saveOrReplaceFromBookmarks,
    copyFromTabset,
    deleteFromTabset,
    deleteTabset,
    getTabset,
    getCurrentTabset,
    selectTabset,
    saveTabset,
    saveCurrentTabset,
    saveText,
    saveMetaLinksFor,
    saveLinksFor,
    addToTabsetId,
    addToTabset,
    tabsetsFor,
    saveThumbnailFor,
    //housekeeping,
    //saveRequestFor,
    removeThumbnailsFor,
    removeContentFor,
    deleteTab,
    urlExistsInATabset,
    urlExistsInCurrentTabset,
    getOrCreateSpecialTabset,
    saveBlob,
    getBlob,
    reloadTabset,
    //handleAnnotationMessage,
    tabsToShow,
    deleteTabsetDescription,
    findFolder,
    findTabInFolder,
    moveTabToFolder
  }

}
