import _, { forEach } from 'lodash'
import { defineStore } from 'pinia'
import { uid } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { STRIP_CHARS_IN_COLOR_INPUT, STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useAuthStore } from 'src/stores/authStore'
import { FolderNode } from 'src/tabsets/models/FolderNode'
import { Tab, TabComment } from 'src/tabsets/models/Tab'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { ChangeInfo, Tabset, TabsetSharing, TabsetStatus } from 'src/tabsets/models/Tabset'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useSelectedTabsetService } from 'src/tabsets/services/selectedTabsetService'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
// import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { computed, ref, watch } from 'vue'

/**
 * a pinia store for "Tabsets".
 *
 * Elements are persisted to the storage provided in the initialize function
 */
export const useTabsetsStore = defineStore('tabsets', () => {
  const loaded = ref(false)
  const lastUpdate = ref(new Date().getTime())

  /**
   * the (internal) storage for this store to use
   */
  let storage: TabsetsPersistence = null as unknown as TabsetsPersistence

  /**
   * a named list of tabsets managed by this extension.
   */
  const tabsets = ref<Map<string, Tabset>>(new Map<string, Tabset>())

  /**
   * the currently selected tabset's id if any. Storing the tabset itself leads to
   * inconsistencies with the tabsets Map.
   */
  const currentTabsetId = ref<string | undefined>(undefined)

  const currentTabsetFolderId = ref<string | undefined>(undefined)

  const reminderTabset = ref<Tabset>(new Tabset('reminders', 'reminder'))

  const getCurrentTabsetId = async (): Promise<string | undefined> => {
    try {
      return useSelectedTabsetService().getSelectedTabsetId()
    } catch (error) {
      console.debug("can't check for newtab extension", error)
    }
    return currentTabsetId.value
  }

  watch(
    () => currentTabsetFolderId.value,
    (newValue: string | undefined, oldValue: string | undefined) => {
      //console.log(`currentTabsetFolderId changed from ${oldValue} -> ${newValue}`)
      const data = { tabsetId: currentTabsetId.value, folderId: newValue }
      // TODO sending too many messages (!?!)
      //sendMsg('tabsets.app.change.currentTabset', data)
    },
  )

  /**
   * initialize store with
   * @param ps a persistence storage
   */
  async function initialize(ps: TabsetsPersistence) {
    storage = ps
    await storage.init()
    // TODO remove after version 0.5.0
    await storage.migrate()
  }

  function setTabset(ts: Tabset) {
    //console.log('setting tabset', ts.id, ts)
    if (useFeaturesStore().hasFeature(FeatureIdent.REMINDER)) {
      ts.tabs.forEach((t: Tab) => {
        if (t.reminder) {
          console.log('adding reminder for ', t)
          reminderTabset.value.tabs.push(t)
        }
      })
    }
    ts.size = JSON.stringify(ts).length
    tabsets.value.set(ts.id, ts)
  }

  async function loadTabsets() {
    if (storage) {
      await storage.loadTabsets()
      loaded.value = true
    }
  }

  async function reloadTabset(tabsetId: string, caller: string | undefined = undefined): Promise<Tabset> {
    const updatedTabset: Tabset = await storage.reloadTabset(tabsetId)
    console.log(`updatedTabset ${Tabset.logIdent(updatedTabset)}`, caller)
    tabsets.value.set(tabsetId, updatedTabset)
    lastUpdate.value = new Date().getTime()
    // console.log('tabsets', tabsets)
    return updatedTabset
  }

  async function createTabset(
    tabsetName: string,
    tabs: Tab[],
    color: string | undefined = undefined,
    spaceId: string | undefined = undefined,
    ignoreDuplicates: boolean = false,
  ): Promise<Tabset> {
    const exceedInfo = useAuthStore().limitExceeded('TABSETS', tabsets.value.size + 1)
    if (exceedInfo.exceeded) {
      await useNavigationService().browserTabFor(
        chrome.runtime.getURL(
          `/www/index.html#/mainpanel/settings?tab=account&exceeded=tabsets&limit=${exceedInfo.limit}`,
        ),
      )
      return Promise.reject('tabsetLimitExceeded')
    }

    const trustedName = tabsetName.replace(STRIP_CHARS_IN_USER_INPUT, '').substring(0, 31)
    const trustedColor = color ? color.replace(STRIP_CHARS_IN_COLOR_INPUT, '').substring(0, 31) : undefined

    if (!ignoreDuplicates) {
      const tabsetWithSameName: Tabset | undefined = _.find(
        [...tabsets.value.values()] as Tabset[],
        (ts: Tabset) => ts.name === trustedName,
      )
      if (tabsetWithSameName) {
        if (tabsetWithSameName.status !== TabsetStatus.DELETED) {
          return Promise.reject(`tabset with same name ('${trustedName}') exists already`)
        }
      }
    }

    let ts: Tabset = null as unknown as Tabset
    ts = new Tabset(uid(), trustedName, tabs, [])
    ts.color = trustedColor
    ts.dynamicUrl = undefined
    if (spaceId) {
      ts.spaces = [spaceId]
    }
    tabsets.value.set(ts.id, ts)
    // console.log("storage", storage)
    //await storage.addTabset(ts)

    // TODO
    // if (currentSpace && currentSpace.id && ts.spaces.findIndex(s => s === currentSpace.id) < 0) {
    //   ts.spaces.push(currentSpace.id)
    // }

    return Promise.resolve(ts)
  }

  async function addTabset(ts: Tabset) {
    console.log('adding tabset (new)', ts.name)
    ts.tabs = _.filter(ts.tabs, (t: Tab) => t !== null)

    // this part is meant to be used to update tabs in case properties
    // are deprecated
    let foundSomething = false
    ts.tabs.forEach((t: Tab) => {
      if (!t.comments) {
        foundSomething = true
        t.comments = []
      }
      if (t.note && t.note.trim().length > 0) {
        foundSomething = true
        console.warn('deprecated property: found tab with note, turning into comment')
        t.comments.push(new TabComment('', t.note))
        delete t['note' as keyof object]
      }
    })
    if (foundSomething) {
      await useTabsetService().saveTabset(ts)
    }

    useWindowsStore().addToWindowSet(ts.window)

    tabsets.value.set(ts.id, ts)
    // TODO markDuplicates(ts)
  }

  async function saveTabset(ts: Tabset, changeInfo?: ChangeInfo) {
    if (ts.id === currentTabsetId.value) {
      //console.debug('setting folderactive', ts.folderActive)
      currentTabsetFolderId.value = ts.folderActive
    }
    ts.lastChange = changeInfo
    const tabsetWithType: Tabset = JSON.parse(JSON.stringify(ts))
    console.log(`storing tabset: ${Tabset.logIdent(tabsetWithType)}`) //,  changeInfo.)
    const res = await storage.saveTabset(tabsetWithType)
    lastUpdate.value = new Date().getTime()
    return res
  }

  function deleteTabset(tsId: string) {
    return storage.deleteTabset(tsId).then((res) => {
      tabsets.value.delete(tsId)
      if (currentTabsetId.value && currentTabsetId.value === tsId) {
        currentTabsetId.value = undefined
        useSelectedTabsetService().clearCurrentTabsetId(tsId)
      }
      return res
    })
  }

  async function selectCurrentTabset(tabsetId: string): Promise<Tabset | undefined> {
    //console.log('selectCurrentTabset', tabsetId)
    await useSelectedTabsetService().setCurrentTabsetId(tabsetId)

    const found = _.find([...tabsets.value.values()] as Tabset[], (k: any) => {
      const ts = k || new Tabset('', '', [])
      return ts.id === tabsetId
    })
    if (found) {
      currentTabsetId.value = found.id
      currentTabsetFolderId.value = found.folderActive
      return found
    } else {
      console.debug(`did not find tabset ${tabsetId}, not trying to reload`)
    }
    return undefined
  }

  function share(tabset: Tabset, sharing: TabsetSharing, sharedId: string | undefined, sharedBy: string) {
    return storage.share(tabset, sharing, sharedId, sharedBy)
  }

  function shareWith(tabset: Tabset, email: string, readonly: boolean, sharedBy: string) {
    return storage.shareWith(tabset, email, readonly, sharedBy)
  }

  // *** getters ***

  const getCurrentTabs = computed((): Tab[] => {
    if (currentTabsetId.value) {
      return (tabsets.value.get(currentTabsetId.value)?.tabs as Tab[]) || []
    }
    return [] as Tab[]
  })

  const getCurrentTabset = computed((): Tabset | undefined => {
    return currentTabsetId.value ? (tabsets.value.get(currentTabsetId.value) as Tabset | undefined) : undefined
  })

  const currentTabsetName = computed(() => {
    return currentTabsetId.value ? tabsets.value.get(currentTabsetId.value)?.name : undefined
  })

  const tabForUrlInSelectedTabset = computed(() => {
    return (url: string): Tab | undefined => {
      if (currentTabsetId.value) {
        const tabs: Tab[] = (tabsets.value.get(currentTabsetId.value)?.tabs as Tab[]) || []
        return _.find(tabs, (t: any) => t.url === url)
      }
    }
  })

  const getTabset = computed(() => {
    return (tabsetId: string): Tabset | undefined => {
      // console.log("searching for tabset", tabsetId)
      return tabsets.value.get(tabsetId) as Tabset | undefined
    }
  })

  const existingInTabset = computed(() => {
    return (searchName: string, spaceId: string | undefined = undefined): Tabset | undefined => {
      const trustedName = searchName.replace(STRIP_CHARS_IN_USER_INPUT, '')
      return _.find([...tabsets.value.values()] as Tabset[], (ts: Tabset) => {
        if (!spaceId) {
          return ts.name === trustedName?.trim()
        } else {
          return ts.name === trustedName?.trim() && ts.spaces.indexOf(spaceId) >= 0
        }
      })
    }
  })

  const getTabAndTabsetId = computed(() => {
    return (tabId: string): TabAndTabsetId | undefined => {
      //console.log('---', tabId, tabsets.value)
      for (const value of tabsets.value.values()) {
        //console.log('---', tabId, value)
        const found = useTabsetService().findTabInFolder([value as Tabset], tabId)
        // const found: Tab | undefined = _.find(value.tabs, t => {
        //   return t.id === tabId
        // })
        if (found && found.tab) {
          return new TabAndTabsetId(found.tab, value.id)
        }
      }
      return undefined
    }
  })

  const tabsetFor = computed(() => {
    return (tabId: string): Tabset | undefined => {
      for (const value of tabsets.value.values()) {
        if (_.find(value.tabs, (t: any) => t.id === tabId)) {
          return value as Tabset
        }
      }
      return undefined
    }
  })

  // does not consider folders yet
  const tabsForUrl = computed((): ((url: string) => TabAndTabsetId[]) => {
    const placeholderPattern = /\${[^}]*}/gm
    return (url: string) => {
      // console.log('---', url, [...tabsets.value.values()] as Tabset[])
      const tabsAndTabsetId: TabAndTabsetId[] = []
      forEach([...tabsets.value.values()] as Tabset[], (ts: Tabset) => {
        // console.log(`checking ts ${Tabset.logIdent(ts)}:`)
        forEach(ts.tabs, (t: Tab) => {
          if (t.url && t.url.replaceAll(placeholderPattern, '') === url) {
            // console.log('checking***', t.url)
            tabsAndTabsetId.push(new TabAndTabsetId(t, ts.id))
          }
        })
      })
      return tabsAndTabsetId
    }
  })

  const tabsFor = (url: string, folders: Tabset[]): TabAndTabsetId[] => {
    if (folders.length === 0) {
      return []
    }
    const placeholderPattern = /\${[^}]*}/gm
    const hits: TabAndTabsetId[] = []
    forEach(folders, (f: Tabset) => {
      const r = f.tabs.filter((t: Tab) => t.url?.replaceAll(placeholderPattern, '') === url)
      hits.push(...r.map((r: Tab) => new TabAndTabsetId(r, f.id)))
      hits.push(...tabsFor(url, f.folders))
    })
    return hits
  }

  const tabsForUrlInCurrentTabset = computed((): ((url: string) => TabAndTabsetId[]) => {
    return (url: string) => {
      const currentTabset = useTabsetsStore().getCurrentTabset
      if (currentTabset) {
        //console.log(`checking ts ${Tabset.logIdent(currentTabset)}:`)
        return tabsFor(url, [currentTabset])
      }
      return []
    }
  })

  const allTabsCount = computed(() => {
    var count = 0

    function countAllTabs(ts: Tabset): number {
      if (!ts || !ts.tabs) {
        return 0
      }
      const directCount: number = ts.tabs.length
      const childrenCount: number = ts.folders?.map((f: Tabset) => countAllTabs(f)).reduce((a, b) => a + b, 0)
      return directCount + childrenCount
    }

    for (const ts of tabsets.value.values()) {
      count = count + countAllTabs(ts)
    }
    return count
  })

  const rssTabs = computed(() => {
    const res: Tab[] = []
    _.forEach([...tabsets.value.values()] as Tabset[], (ts: Tabset) => {
      if (ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE) {
        _.forEach(ts.tabs, (t: Tab) => {
          if (t.url && t.url.endsWith('.rss')) {
            res.push(t)
          }
        })
      }
    })
    return res
  })

  const getAllUrls = (): string[] => {
    return _.map(
      _.flatMap([...tabsets.value.values()] as Tabset[], (ts: Tabset) => ts.tabs),
      (t: Tab) => {
        //console.log('t', t)
        return t.url || ''
      },
    )
  }

  const getActiveFolder = (
    root: Tabset,
    folderActive: string | undefined = root.folderActive,
    level = 0,
  ): Tabset | undefined => {
    //console.log(`get active folder: root# ${root.id}, folderActive: ${folderActive}, level: ${level}`)
    if (level > 10) {
      console.warn('runaway method')
      return undefined
    }
    if (!folderActive || root.id === folderActive) {
      return root
    }
    for (const f of root.folders) {
      //console.log('  checking folder', f.id)
      if (f.id === folderActive) {
        return f
      } else {
        const subFolder = getActiveFolder(f, folderActive, level + 1)
        if (subFolder) {
          return subFolder
        }
      }
    }
    return undefined
  }

  const getFolderChain = (
    folderId: string,
    tabsetOrFolders: Tabset[] = [...useTabsetsStore().tabsets.values()],
    chain: string[] = [],
    level = 0,
  ): string[] => {
    //console.log(`get active folder: root# ${root.id}, folderActive: ${folderActive}, level: ${level}`)
    if (level > 10) {
      console.warn('runaway method')
      return []
    }

    //console.log(`  searching for folder '${folderId}', level ${level}`)
    for (const f of tabsetOrFolders) {
      if (f.id === folderId) {
        return chain.concat(folderId)
      } else {
        if (f.folders.length > 0) {
          const subChain = getFolderChain(folderId, f.folders, chain, level + 1)
          //console.log('subchain', subChain)
          if (subChain.length > 0) {
            return subChain.concat(f.id)
          }
        }
      }
    }
    return chain
  }

  function addFolders(f: FolderNode, folders: Tabset[]) {
    for (const folder of folders) {
      const child = new FolderNode(folder.name, folder.id, [])
      f.children.push(child)
      addFolders(child, folder.folders)
    }
  }

  const getFolderTree = (tabset: Tabset): FolderNode => {
    const f: FolderNode = new FolderNode('root', tabset.id, [])
    addFolders(f, tabset.folders)
    return f
  }

  const getPageTabs = (tabset: Tabset | undefined): Tab[] => {
    if (!tabset) {
      return []
    }
    return tabset.tabs.filter((t: Tab) => t.page !== undefined)
  }

  const loadPublicTabset = (sharedId: string) => storage.loadPublicTabset(sharedId, undefined)

  const removeReminder = (tab: Tab) =>
    (reminderTabset.value.tabs = reminderTabset.value.tabs.filter((t: Tab) => t.id !== tab.id))

  const activeReminders = (): Tab[] =>
    reminderTabset.value.tabs.filter((t: Tab) => new Date().getTime() >= (t.reminder ?? 0))

  function checkTabsets(tabsets: Tabset[], tabId: string, chain: Tabset[] = []): [Tabset[], Tab | undefined] {
    //console.log(`starting with`, tabsets.map((t) => t.name).join(','), `Level ${chain.length}`)
    for (const tabset of tabsets) {
      //console.log('checking tabset', tabset.name)
      for (const t of tabset.tabs) {
        //console.log('checking tab', t.url)
        if (t.id === tabId) {
          //console.log('found tab!', t.id)
          chain.push(tabset)
          return [chain, t]
        }
      }
      chain.push(tabset)
      const result = checkTabsets(tabset.folders, tabId, chain)
      if (result[1]) {
        return result
      } else {
        chain.pop()
      }
    }
    return [[], undefined]
  }

  const getParentChainForTabId = (tabId: string): [Tabset[], Tab | undefined] => {
    return checkTabsets([...tabsets.value.values()], tabId)
  }

  return {
    initialize,
    tabsets,
    createTabset,
    addTabset,
    saveTabset, // check save vs add vs create
    setTabset,
    deleteTabset,
    selectCurrentTabset,
    getCurrentTabs,
    getCurrentTabset,
    currentTabsetName,
    getCurrentTabsetId,
    currentTabsetFolderId,
    tabForUrlInSelectedTabset,
    getTabset,
    existingInTabset,
    getTabAndTabsetId,
    tabsetFor,
    tabsForUrl,
    tabsForUrlInCurrentTabset,
    allTabsCount,
    rssTabs,
    getAllUrls,
    loadTabsets,
    getActiveFolder,
    getFolderChain,
    getFolderTree,
    share,
    shareWith,
    loadPublicTabset,
    reloadTabset,
    reminderTabset,
    removeReminder,
    activeReminders,
    loaded,
    lastUpdate,
    getParentChainForTabId,
    getPageTabs,
  }
})
