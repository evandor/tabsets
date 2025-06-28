import _ from 'lodash'
import { defineStore } from 'pinia'
import { useUtils } from 'src/core/services/Utils'
// import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { Window } from 'src/windows/models/Window'
import { WindowAction, WindowHolder } from 'src/windows/models/WindowHolder'
import IndexedDbWindowsPersistence from 'src/windows/persistence/IndexedDbWindowsPersistence'
import { computed, ref } from 'vue'

/**
 * a pinia store for "Windows".
 *
 */

let storage = IndexedDbWindowsPersistence

export const useWindowsStore = defineStore('windows', () => {
  const { inBexMode, sendMsg, calcHostList, addListenerOnce } = useUtils()

  const onWindowCreatedListener = (window: chrome.windows.Window) => onWindowCreate(window)
  const onRemovedListener = (windowId: number) => onRemoved(windowId)
  const onBoundsChangedListener = (window: chrome.windows.Window) => onUpdate(window.id || 0)
  const onFocusChangedListener = (windowId: number) => onFocused(windowId)

  const onTabUpdatedListener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) =>
    onTabUpdated(tabId, changeInfo, tab)

  const onTabRemovedListener = (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => onTabRemoved(tabId, removeInfo)

  const lastUpdate = ref(new Date().getTime())

  /**
   * the map of all 'ever used' Chrome windows, even if they are not currently in use,
   * using the id as key.
   *
   * Initialized at start with all windows from "windows" storage, on "onCreated" event and on
   * "onRemoved" event (where a window without title is removed again, including storage)
   */
  const allWindows = ref<Map<number, Window>>(new Map())

  /**
   * the array all actually currently opened Chrome windows.
   *
   * Initialized at start (from chrome.windows.getAll) and on "onCreated" and "onRemoved" events.
   */
  const currentBrowserWindows = ref<chrome.windows.Window[]>([])

  /**
   * the result of 'chrome.windows.getCurrent'
   *
   * Initialized at start and on "onCreated" and "onRemoved" events.
   */
  const currentBrowserWindow = ref<chrome.windows.Window | undefined>(undefined)

  /**
   * updated from 'allWindows' data when currentWindows is set.
   */
  const currentWindowName = ref<string | undefined>(undefined)

  /**
   * Set of all names for windows from all tabsets, initialized when
   * tabsets are added during startup (tabsStore#addTabset)
   */
  const windowSet = ref<Set<string>>(new Set())

  const devices = ref<chrome.sessions.Device[]>([])

  // const recentlyClosedSessions = ref<chrome.sessions.Session[]>([])

  /**
   * initialize store
   */
  async function initialize() {
    storage = IndexedDbWindowsPersistence
    await storage.init()
    // await storage.migrate()
    await setup('initialization')
  }

  function initListeners() {
    if (inBexMode()) {
      // window listeners
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      chrome.windows.onCreated.addListener(onWindowCreatedListener)
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      chrome.windows.onRemoved.addListener(onRemovedListener)
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      chrome.windows.onFocusChanged.addListener(onFocusChangedListener)
      if (chrome.windows.onBoundsChanged) {
        // not defined on firefox
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        chrome.windows.onBoundsChanged.addListener(onBoundsChangedListener)
      }

      // tab listener
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      addListenerOnce(chrome.tabs.onUpdated, onTabUpdatedListener)
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      addListenerOnce(chrome.tabs.onRemoved, onTabRemovedListener)

      //chrome.tabs.onRemoved.addListener(onTabRemovedListener)
    }
  }

  function removeListener() {
    if (inBexMode()) {
      // window listeners
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      chrome.windows.onCreated.removeListener(onWindowCreatedListener)
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      chrome.windows.onRemoved.removeListener(onRemovedListener)
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      chrome.windows.onFocusChanged.removeListener(onFocusChangedListener)
      if (chrome.windows.onBoundsChanged) {
        // not defined on firefox
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        chrome.windows.onBoundsChanged.removeListener(onBoundsChangedListener)
      }

      // tab listeners
      // chrome.tabs.onUpdated.removeListener(onTabUpdatedListener)
      //chrome.tabs.onRemoved.removeListener(onTabRemovedListener)
    }
  }

  async function onTabRemoved(tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
    //console.log(`tabRemoved tabId: ${tabId}, windowId: ${removeInfo.windowId}`)
    currentBrowserWindows.value = await chrome.windows.getAll({ populate: true })
    setLastUpdate()
  }

  // #region snippet
  /**
   * when a new window is created with the restore tabset command, tabs are added one by one.
   * We listen to those events and try to figure out if the new window should be assigned the
   * name of an existing window from the windows-Database.
   */
  async function onTabUpdated(number: number, info: chrome.tabs.TabChangeInfo, chromeTab: chrome.tabs.Tab) {
    if (info.status !== 'complete') {
      return
    }
    //console.debug(`tabUpdate: ${chromeTab.url?.substring(0, 40)}`)
    await checkSimilarity(chromeTab.windowId)
    currentBrowserWindows.value = await chrome.windows.getAll({ populate: true })
    setLastUpdate()
  }
  // #endregion snippet

  const getWindowsForMarkupTable = computed(() => (fnc: (name: string) => WindowAction[] = (a: string) => []) => {
    const browserWindows: WindowHolder[] = _.map(
      currentBrowserWindows.value as chrome.windows.Window[],
      (browserWindow: chrome.windows.Window) => {
        const windowFromStore: Window | undefined = windowForId(browserWindow.id || -2)
        const windowName = windowNameFor(browserWindow.id || 0) || browserWindow.id?.toString() || '???'
        // console.log('browserWindow', browserWindow, windowFromStore, windowName)

        if (windowFromStore) {
          windowFromStore.title = windowName
          return WindowHolder.of(windowFromStore, browserWindow, browserWindow.id || -3, fnc(windowName))
        } else {
          return WindowHolder.of(null as unknown as Window, browserWindow, browserWindow.id || -3, fnc(windowName))
        }
      },
    )

    const otherWindows = _.map(
      _.filter([...allWindows.value.values()], (w: Window) => {
        return browserWindows.findIndex((wh: WindowHolder) => w.id === wh.holderId) < 0 && w.hostList.length > 0
      }),
      (w: Window) => {
        //console.log('---window', w)
        const windowFromStore: Window | undefined = windowForId(w.id || -2, 'windowsStore')
        const windowName = windowNameFor(w.id || 0) || w.id.toString()
        if (windowFromStore) {
          windowFromStore.title = windowName
          return WindowHolder.of(windowFromStore, undefined, windowFromStore ? windowFromStore.id : -4, fnc(windowName))
        } else {
          return WindowHolder.of(w, undefined, -5, fnc(windowName))
        }
      },
    )

    // sessions
    let sessions: WindowHolder[] = []
    // if (useFeaturesStore().hasFeature(FeatureIdent.SESSIONS)) {
    //   //const devices = await chrome.sessions.getDevices()
    //   sessions = recentlyClosedSessions.value.map((s: chrome.sessions.Session) => {
    //     console.log('checking session', s)
    //     return WindowHolder.of(null as unknown as Window, s.window, s.lastModified, [])
    //   })
    // }

    const openWindows = browserWindows
      .concat(otherWindows)
      .concat(sessions)
      .filter((wh: WindowHolder) => {
        //console.log('checking openwindow', wh, wh.cw)
        return wh.cw
      })
    const res = _.sortBy(openWindows, 'index')
    // console.log('>>>res<<<', res)
    return res
  })

  async function setup(trigger: string = '', keepWindowsFromStorage = false) {
    // if (!useFeaturesStore().hasFeature(FeatureIdent.WINDOWS_MANAGEMENT) || !inBexMode()) {
    //   return
    // }
    console.debug(
      `chrome windows listeners setup triggered (${trigger}), keepWindowsFromStorage: ${keepWindowsFromStorage}`,
    )

    const browserWindows: chrome.windows.Window[] = await chrome.windows.getAll({ populate: true })
    currentBrowserWindows.value = browserWindows
    //console.debug(` initializing current chrome windows with ${currentBrowserWindows.value?.length} window(s)`)

    if (!keepWindowsFromStorage) {
      // adding potentially new windows to storage
      await updateStorageFromBrowserWindows()
    }

    // setting all (new and older) windows to 'allWindows':
    allWindows.value = new Map()
    let index = 0

    const storedWindows: Window[] = await storage.getWindows()

    const sortedStoredWindows = _.sortBy(storedWindows, 'index')
    for (const tabsetWindowFromStorage of sortedStoredWindows) {
      // index handling
      const indexFromDb = tabsetWindowFromStorage.index
      const indicesDiffer = indexFromDb !== index
      const indexToUse = index++

      if (indicesDiffer) {
        try {
          await updateWindowIndex(tabsetWindowFromStorage.id, indexToUse)
        } catch (err) {
          console.error('error when updating window', tabsetWindowFromStorage.id, indexToUse, err)
        }
        tabsetWindowFromStorage.index = indexToUse
      }
      allWindows.value.set(tabsetWindowFromStorage.id || 0, tabsetWindowFromStorage)
    }
    //console.log('allWindows set to ', allWindows.value)

    // add title to windowSet if existing
    for (const w of allWindows.value.values()) {
      if (w && w.title) {
        windowSet.value.add(w.title)
      }
    }

    chrome.windows.getCurrent({ windowTypes: ['normal'], populate: true }, (window: chrome.windows.Window) => {
      currentBrowserWindow.value = window
      if (currentBrowserWindow.value && currentBrowserWindow.value.id) {
        currentWindowName.value = windowNameFor(currentBrowserWindow.value.id)
      }
    })

    // if (useFeaturesStore().hasFeature(FeatureIdent.SESSIONS)) {
    //   devices.value = await chrome.sessions.getDevices()
    //   //console.log('got devices', devices.value)
    //   recentlyClosedSessions.value = await chrome.sessions.getRecentlyClosed()
    //   //console.log('got recentlyClosedSessions', recentlyClosedSessions.value)
    // }

    lastUpdate.value = new Date().getTime()
  }

  async function onRemoved(windowId: number) {
    // remove only if window does not have a title
    const w = await storage.getWindow(windowId)
    console.debug('onWindowRemoved', w, windowId)
    if (w && !w.title) {
      await removeWindow(windowId)
    }
    await updateStorageFromBrowserWindows()
    const windowsFromStorage = await storage.getWindows()
    allWindows.value = new Map()
    for (const storageWindow of windowsFromStorage) {
      allWindows.value.set(storageWindow.id, storageWindow)
    }
    //console.log('all windows set to', allWindows.value)
  }

  async function onWindowCreate(window: chrome.windows.Window) {
    //console.log('onWindowCreated', window, allWindows.value)
    await updateStorageFromBrowserWindows()
    const windowsFromStorage = await storage.getWindows()
    allWindows.value = new Map()
    for (const storageWindow of windowsFromStorage) {
      allWindows.value.set(storageWindow.id, storageWindow)
    }
    // console.log('all windows set to', allWindows.value)
  }

  /**
   * we're only listening onBoundsChanged (of active windows),
   * so title and index should not change!
   * @param windowId
   */
  async function onUpdate(windowId: number) {
    if (windowId >= 0) {
      const windowFromDb: Window | undefined = windowForId(windowId, 'windowsStore onupdate')
      if (windowFromDb) {
        //console.debug(`updating window #${windowId}: title='${windowFromDb?.title}', index=${windowFromDb?.index}`)
        const chromeWindow = await chrome.windows.get(windowId, { populate: true })
        const hostList = calcHostList(chromeWindow.tabs || [])
        const newWindow = new Window(
          windowId,
          chromeWindow,
          windowFromDb.title,
          windowFromDb.index,
          windowFromDb.open,
          hostList,
        )
        //console.log('updated to ', newWindow.toString())
        await storage.updateWindow(newWindow)
        await refreshCurrentWindows('windowsStore')
      } else {
        console.debug(`could not update window #${windowId}`)
      }
    }
  }

  async function onFocused(windowId: number) {
    // if (windowId !== -1) {
    //   console.debug(`onFocused ${windowId}`)
    // }
    const browserWindows: chrome.windows.Window[] = await chrome.windows.getAll({ populate: true })
    currentBrowserWindows.value = browserWindows
    lastUpdate.value = new Date().getTime()
  }

  function windowForId(id: number, logMsg?: string): Window | undefined {
    const result = allWindows.value.get(id)
    if (!result) {
      //console.log(`getting window for id ${id} failed, called from ${logMsg || '?'}`, allWindows.value)
    }
    return result
  }

  function windowNameFor(id: number) {
    //console.log("windowNameFor", id, allWindows.value)
    return allWindows.value.get(id)?.title
  }

  function windowIdFor(name: string): number | undefined {
    return _.find([...allWindows.value.keys()], (key: number) => {
      const val = allWindows.value.get(key)
      return val?.title === name
    })
  }

  async function currentWindowFor(windowToOpen: string): Promise<chrome.windows.Window | undefined> {
    if (windowToOpen === 'current' && chrome && chrome.windows) {
      return await chrome.windows.getCurrent()
    } else if (windowIdFor(windowToOpen)) {
      const potentialWindowId = windowIdFor(windowToOpen)
      // console.log("windowFor2", potentialWindowId)
      if (potentialWindowId) {
        try {
          return await chrome.windows.get(potentialWindowId, { populate: true })
        } catch (err) {
          return Promise.resolve(undefined)
        }
      }
    }
    return Promise.resolve(undefined)
  }

  async function windowFor(title: string): Promise<Window | undefined> {
    if (!storage) {
      return undefined
    }
    const windowsFromDb = await storage.getWindows()
    for (const w of windowsFromDb) {
      if (w['title' as keyof object] === title) {
        return w
      }
    }
    return undefined
  }

  function addToWindowSet(windowName: string) {
    if (windowName !== 'current') {
      windowSet.value.add(windowName)
    }
  }

  async function upsertWindow(
    window: chrome.windows.Window | void,
    holderId: number | undefined,
    title: string | undefined,
    index: number = 0,
  ) {
    if (window) {
      const hostList = calcHostList(window.tabs || [])
      console.log(
        `upserting window: id=${window.id}, title=${title}, index=${index}, open=default(false), #hostList=${hostList.length}`,
      )
      const tabsetsWindow = new Window(window.id || 0, window, title, index, false, hostList)
      if (window.id) {
        allWindows.value.set(window.id, tabsetsWindow)
      }
      await storage.upsertWindow(tabsetsWindow)
    } else {
      const windowFromStorage: Window | undefined = _.find(
        [...allWindows.value.values()],
        (w: Window) => w.id === holderId,
      )
      if (windowFromStorage) {
        windowFromStorage.title = title
        await storage.upsertWindow(windowFromStorage)
      }
    }
    sendMsg('window-updated', { initiated: 'WindowsStore#upsertWindow' })
  }

  async function upsertTabsetWindow(window: Window) {
    console.debug(
      `upserting window: id=${window.id}, title=${window.title}, index=${window.index}, open=${window.open}, #hostList=${window.hostList.length}`,
    )
    await storage.upsertWindow(window)
    setLastUpdate()
  }

  async function removeWindow(windowId: number) {
    await storage
      .removeWindow(windowId)
      .catch((err: any) => console.warn('could not delete window ' + windowId + ' due to: ' + err))
  }

  async function removeWindowByTitle(title: string) {
    storage.getWindows().then((windows: Window[]) => {
      windows.forEach((w) => {
        if (w.title === title) {
          storage
            .removeWindow(w.id)
            .catch((err: any) => console.debug('could not delete window ' + w.id + ' due to: ' + err))
        }
      })
    })
  }

  async function refreshCurrentWindows(msg: string) {
    //console.debug('refreshCurrentWindows', msg)
    currentBrowserWindows.value = await chrome.windows.getAll({ populate: true })
  }

  async function updateWindowIndex(windowId: number, indexToUse: number) {
    console.log('updating window index', windowId, indexToUse)
    return storage.getWindow(windowId).then((w: Window | undefined) => {
      if (w) {
        w.index = indexToUse
        const allWindow = allWindows.value.get(windowId)
        if (allWindow) {
          allWindow.index = indexToUse
        }
        return storage.updateWindow(w)
        //.then(() => sendMsg('window-updated', {initiated: "WindowsStore#updateWindowIndex"}))
      } else {
        return Promise.reject('window for #' + windowId + ' not found')
      }
    })
  }

  // async function refreshTabsetWindow(windowId: number) {
  //   try {
  //     //console.log("refreshing tabset window", windowId)
  //     const tabsetWindow = await storage.getWindow(windowId)
  //     const chromeWindow = await chrome.windows.get(windowId, { populate: true })
  //     if (tabsetWindow && chromeWindow) {
  //       tabsetWindow.hostList = calcHostList(chromeWindow.tabs || [])
  //       await storage.updateWindow(tabsetWindow)
  //     }
  //   } catch (err) {
  //     console.log('got error', err)
  //   }
  // }

  /**
   * in some cases, an outside event (e.g. RenameWindow) can change the underlying database
   * without the store noticing.
   */
  function setLastUpdate() {
    lastUpdate.value = new Date().getTime()
  }

  function getSimilarity(intersection: Set<string>, browserList: string[], dbList: string[]): number {
    return browserList.length === 0 || dbList.length === 0
      ? 0
      : Math.min(intersection.size / browserList.length, intersection.size / dbList.length)
  }

  async function checkSimilarity(tabsWindowId: number) {
    const browserWindow = await chrome.windows.get(tabsWindowId, { populate: true })
    const browserTabs: string[] = browserWindow.tabs ? browserWindow.tabs.map((t: chrome.tabs.Tab) => t.url || '') : []

    let maxSimilarity = 0
    let similarWindowFromDb = null
    const dbWindows = await storage.getWindows()
    for (const dbWindow of dbWindows) {
      if (dbWindow.hostList) {
        const intersection = new Set([...browserTabs].filter((x) => new Set(dbWindow.hostList).has(x)))
        //console.log('intersection', intersection, intersection.size, dbWindow.title)
        const similarity = getSimilarity(intersection, browserTabs, dbWindow.hostList)
        if (similarity > maxSimilarity && dbWindow.title) {
          maxSimilarity = similarity
          //console.log('max similarity for named window set to', similarity)
          if (maxSimilarity > 0.8) {
            similarWindowFromDb = dbWindow
          }
        }
      }
    }

    if (similarWindowFromDb) {
      console.log('similar window', similarWindowFromDb)
    }

    if (similarWindowFromDb) {
      // reuse existing
      const oldId = similarWindowFromDb.id
      const useId = browserWindow.id
      if (useId && useId !== oldId) {
        similarWindowFromDb.id = useId
        console.log('replacing old window ' + oldId + ' with ' + JSON.stringify(similarWindowFromDb))
        //await this.db.delete(this.STORE_IDENT, oldId)
        await storage.deleteWindow(oldId)
        await storage.addWindow(similarWindowFromDb)
      }
    }
  }

  async function updateStorageFromBrowserWindows() {
    const browserWindows: chrome.windows.Window[] = await chrome.windows.getAll({ populate: true })
    for (const browserWindow of browserWindows) {
      const hostList = calcHostList(browserWindow.tabs || [])
      const newWindow = new Window(browserWindow.id || 0, browserWindow, undefined, 0, false, hostList)
      await storage.addWindow(newWindow)
    }
  }

  return {
    getWindowsForMarkupTable,
    initialize,
    initListeners,
    resetListeners: removeListener,
    setup,
    currentBrowserWindows,
    currentBrowserWindow,
    currentWindowName,
    windowNameFor,
    windowSet,
    upsertWindow,
    removeWindow,
    refreshCurrentWindows,
    windowFor,
    currentWindowFor,
    windowForId,
    allWindows,
    addToWindowSet,
    upsertTabsetWindow,
    updateWindowIndex,
    lastUpdate,
    setLastUpdate,
  }
})
