import {defineStore} from 'pinia';
import {ref} from "vue";
import PersistenceService from "src/services/PersistenceService";
import {useUtils} from "src/services/Utils";
import {Window} from "src/models/Window";
import _ from "lodash"
import throttledQueue from "throttled-queue";

/**
 * a pinia store for "Windows".
 *
 * Elements are persisted to the storage provided in the initialize function
 */

let storage: PersistenceService = null as unknown as PersistenceService

function closeTabWithTimeout(timeout: number, tabToCloseId: number | undefined = undefined): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (tabToCloseId) {
        chrome.tabs.remove(tabToCloseId).catch((err) => console.debug(err))
      }
      resolve("Success!");
    }, timeout);
  });
}

class WindowHolder {
  constructor(
    public index: number,
    public cw: chrome.windows.Window,
    public windowFromStore: Window | undefined) {
  }
}

function getSortedWindows(windowForId: (id: number) => (Window | undefined)) {
  const theWindows: WindowHolder[] = _.sortBy(_.map(useWindowsStore().currentWindows as chrome.windows.Window[], (cw: chrome.windows.Window) => {
    const windowFromStore: Window | undefined = windowForId(cw.id || -1)
    return new WindowHolder(windowFromStore?.index || 0, cw, windowFromStore)
  }), "index")
  return theWindows;
}

export const useWindowsStore = defineStore('windows', () => {

  const {inBexMode} = useUtils()

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
  const currentWindows = ref<chrome.windows.Window[]>([])

  /**
   * the result of 'chrome.windows.getCurrent'
   *
   * Initialized at start and on "onCreated" and "onRemoved" events.
   */
  const currentWindow = ref<chrome.windows.Window>(null as unknown as chrome.windows.Window) //null as unknown as chrome.windows.Window

  /**
   * updated from 'allWindows' data when currentWindows is set.
   */
  const currentWindowName = ref<string | undefined>(undefined)

  // screenshot Window
  const screenshotWindow = ref<number>(null as unknown as number)

  /**
   * Set of all names for windows from all tabsets, initialized when
   * tabsets are added during startup (tabsStore#addTabset)
   */
  const windowSet = ref<Set<string>>(new Set())

  /**
   * initialize store with
   * @param providedDb a persistence storage
   */
  async function initialize(providedDb: PersistenceService) {
    console.log("initializing windowsStore")
    storage = providedDb
    setup("initialization")
  }

  function setup(trigger: string = "") {
    if (!inBexMode()) {
      return
    }
    console.debug("init chrome windows listeners with trigger", trigger)
    chrome.windows.getAll((windows) => {

      currentWindows.value = windows
      console.debug("initializing current windows with", currentWindows.value.length)

      // adding potentially new windows to storage
      const res: Promise<any>[] = windows.flatMap((window: chrome.windows.Window) => {
        return storage.addWindow(new Window(window.id || 0, window, undefined))
      })

      // setting all (new and older) windows to 'allWindows'
      Promise.all(res)
        .then(() => {
          allWindows.value = new Map()
          let index = 10000
          const usedIndices: number[] = []

          storage.getWindows().then(res => {
            res.forEach(tabsetWindowFromStorage => {

              // index handling
              //console.log("checking", tabsetWindowFromStorage.id, tabsetWindowFromStorage.index)

              const indexFromDb = tabsetWindowFromStorage.index
              let indexToUse = tabsetWindowFromStorage.index ? tabsetWindowFromStorage.index : index++
              if (usedIndices.indexOf(indexToUse) >= 0) {
                const candiate = indexToUse
                indexToUse = 1 + Math.max(...usedIndices)
                console.log(`found used index: ${candiate} -> ${indexToUse}`)
                updateWindowIndex(tabsetWindowFromStorage.id, indexToUse)
                  .then(() => console.log("done with updating window", tabsetWindowFromStorage.id, indexToUse))
                  .catch((err) => console.error("error when updating window", tabsetWindowFromStorage.id, indexToUse, err))
              }
              if (!indexFromDb) {
                updateWindowIndex(tabsetWindowFromStorage.id, indexToUse)
                  .then(() => console.log("done with updating window", tabsetWindowFromStorage.id, indexToUse))
                  .catch((err) => console.error("error when updating window", tabsetWindowFromStorage.id, indexToUse, err))
              }
              tabsetWindowFromStorage.index = indexToUse
              usedIndices.push(indexToUse)
              allWindows.value.set(tabsetWindowFromStorage.id || 0, tabsetWindowFromStorage)

              const inCurrentWindows = windows.find(w => w.id === tabsetWindowFromStorage.id) !== undefined

              console.log(`assigned window #${tabsetWindowFromStorage.id} (name: ${tabsetWindowFromStorage.title}): ${indexFromDb} -> ${tabsetWindowFromStorage.index}, open: ${inCurrentWindows}`)
            })
            for (const id of allWindows.value.keys()) {
              const w = allWindows.value.get(id)
              if (w && w.title) {
                //console.log("checking", w, )
                windowSet.value.add(w.title)
              }
            }
            //console.log("%callWindows assigned", "color:green", allWindows.value, windowSet.value)

            chrome.windows.getCurrent({windowTypes: ['normal']}, (window: chrome.windows.Window) => {
              currentWindow.value = window
              if (currentWindow.value && currentWindow.value.id) {
                //console.log("%c******", "color:blue", currentWindow.value.id, windowNameFor(currentWindow.value.id))
                currentWindowName.value = windowNameFor(currentWindow.value.id)
              }
            })

            // add context menus for moving to other window
            if (chrome && chrome.contextMenus) {
              chrome.windows.getCurrent().then(currentWindow => {
                for (const window of currentWindows.value) {
                  //console.log("da!!!",window,useWindowsStore().windowNameFor(window.id))
                  // TODO this is always the "default" window
                  if (currentWindow.id !== window.id) {
                    chrome.contextMenus.create({
                      id: 'move_to|' + window.id,
                      parentId: 'move_to_window',
                      title: '...to window ' + useWindowsStore().windowNameFor(window.id) || window.id,
                      contexts: ['all']
                    })
                  }
                }
              })
            }
          })

        })
    })

  }

  async function onRemoved(windowId: number) {
    // remove only if window does not have a title
    const w = await storage.getWindow(windowId)
    console.debug("on removed", w, windowId)
    if (w && !w.title) {
      await removeWindow(windowId)
    }
    setup("onRemove")
  }

  /**
   * we've only listening to onFocusChanged or onBoundsChanged (of active windows),
   * so title and index should not change!
   * @param windowId
   */
  async function onUpdate(windowId: number) {
    if (windowId >= 0) {
      const windowFromDb = windowForId(windowId)
      console.log(`updating window #${windowId}: title='${windowFromDb?.title}', index=${windowFromDb?.index}`, windowId, windowFromDb)
      if (windowFromDb) {
        const chromeWindow = await chrome.windows.get(windowId)
        await storage.updateWindow(new Window(windowId, chromeWindow, windowFromDb.title, windowFromDb.index))
        refreshCurrentWindows()
      }
    }
  }

  function initListeners() {
    if (inBexMode()) {
      chrome.windows.onCreated.addListener(() => setup("onCreated"))
      chrome.windows.onRemoved.addListener((windowId: number) => onRemoved(windowId))
      chrome.windows.onFocusChanged.addListener((windowId) => onUpdate(windowId))
      chrome.windows.onBoundsChanged.addListener((window: chrome.windows.Window) => onUpdate(window.id || 0))
    }
  }

  function windowForId(id: number): Window | undefined {
    return allWindows.value.get(id)
  }

  function currentWindowForId(id: number): chrome.windows.Window | undefined {
    return currentWindows.value.find(i => i.id === id)
  }

  function windowNameFor(id: number) {
    console.log("windowNameFor", id, allWindows.value)
    return allWindows.value.get(id)?.title
  }

  function windowIdFor(name: string): number | undefined {
    return _.find([...allWindows.value.keys()], key => {
      const val = allWindows.value.get(key)
      return val?.title === name
    })
  }

  async function currentWindowFor(windowToOpen: string): Promise<chrome.windows.Window | undefined> {
    if (windowToOpen === 'current' && chrome && chrome.windows) {
      // @ts-ignore
      return await chrome.windows.getCurrent()
    } else if (windowIdFor(windowToOpen)) {
      const potentialWindowId = windowIdFor(windowToOpen)
      // console.log("windowFor2", potentialWindowId)
      if (potentialWindowId) {
        try {
          return await chrome.windows.get(potentialWindowId)
        } catch (err) {
          return Promise.resolve(undefined)
        }
      }
    }
    return Promise.resolve(undefined)
  }

  async function windowFor(title: string): Promise<Window | undefined> {
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

  async function upsertWindow(window: chrome.windows.Window, title: string | undefined, index: number = 0) {
    console.log("upserting window", window.id, title, index)
    const tabsetsWindow = new Window(window.id || 0, window, title, index)
    await storage.upsertWindow(tabsetsWindow)
  }

  async function removeWindow(windowId: number) {
    await storage.removeWindow(windowId)
      .catch((err) => console.warn("could not delete window " + windowId + " due to: " + err))
  }

  async function removeWindowByTitle(title: string) {
    storage.getWindows().then((windows) => {
      windows.forEach(w => {
        if (w.title === title) {
          storage.removeWindow(w.id)
            .catch((err) => console.debug("could not delete window " + w.id + " due to: " + err))
        }
      })
    })
  }

  function openThrottledInWindow(urls: string[], windowCreateData: object = {focused: true, width: 1024, height: 800}) {
    console.log("%copenThrottledInWindow...", "color:green")
    const throttleOnePerXSeconds = throttledQueue(1, 1000, true)
    chrome.windows.create(windowCreateData, (window: any) => {

      //console.log("%cgot window", "color:green", window.id)
      useWindowsStore().removeWindowByTitle("%monitoring%")
      useWindowsStore().upsertWindow(window, "%monitoring%")

      useWindowsStore().screenshotWindow = window.id

      const promises: Promise<any>[] = []
      for (const u of urls) {
        if (u.indexOf("${") >= 0) {
          console.debug("not monitoring url due to placeholder(s)", u)
          break
        }
        const p = throttleOnePerXSeconds(async () => {
          const createProperties = {windowId: window.id, url: u}
          //console.log("createProperties", createProperties)
          chrome.tabs.create(createProperties, (tab: chrome.tabs.Tab) => {
            closeTabWithTimeout(2000, tab.id)
          })
          return closeTabWithTimeout(1000)
        })
        promises.push(p)
      }

      Promise.all(promises)
        .then(() => {
          setTimeout(() => {
            //console.log("setting timeout")
            chrome.windows.remove(window.id)
            useWindowsStore().screenshotWindow = null as unknown as number
          }, 2000)
        })
    })
  }

  function refreshCurrentWindows() {
    console.log("refreshCurrentWindows")
    chrome.windows.getAll((windows) => {
      currentWindows.value = windows
    })
  }

  async function moveWindowUp(index: number) {
    console.log("moving up", index)
    const theWindows = getSortedWindows(windowForId);

    console.log("*** theWindows", theWindows)

    let foundRow = undefined
    for (let i = 0; i < theWindows.length - 1; i++) {
      const windowOriginalIndex = index
      if (theWindows[i + 1].index === windowOriginalIndex) {
        // i = row before element to move up
        // i+1 element to move up
        foundRow = i

        const windowToMoveDown: chrome.windows.Window | undefined = useWindowsStore().currentWindowForId(theWindows[i].cw.id || -1)
        const windowToMoveUp: chrome.windows.Window | undefined = useWindowsStore().currentWindowForId(theWindows[i + 1].cw.id || -1)

        console.log("windowToMoveDown", windowToMoveDown)
        console.log("windowToMoveUp", windowToMoveUp)

        const indexToSwitch = theWindows[i].index // element before
        console.log("found index to switch", indexToSwitch)

        console.log("setting", i, windowOriginalIndex)
        if (theWindows[i].windowFromStore) {
          // @ts-ignore
          theWindows[i].windowFromStore.index = windowOriginalIndex
        }

        console.log("setting", i + 1, indexToSwitch)
        if (theWindows[i + 1].windowFromStore) {
          // @ts-ignore
          theWindows[i + 1].windowFromStore.index = indexToSwitch
        }

        if (windowToMoveDown) {
          console.log("moving down", i)
          await useWindowsStore().upsertWindow(windowToMoveDown, theWindows[i].windowFromStore?.title, windowOriginalIndex)
        }
        if (windowToMoveUp) {
          await useWindowsStore().upsertWindow(windowToMoveUp, theWindows[i + 1].windowFromStore?.title, indexToSwitch)
        }

      }
      if (foundRow) {
        break
      }

    }
  }

  async function moveWindowDown(index: number) {
    console.log("moving down", index)
    const theWindows = getSortedWindows(windowForId);
    let foundRow = undefined
    for (let i = 1; i < theWindows.length; i++) {
      const windowOriginalIndex = index
      if (theWindows[i - 1].index === windowOriginalIndex) {
        // i = row after element to move down, i.e. to move up
        // i-1 element to move down
        foundRow = i

        const windowToMoveUp: chrome.windows.Window | undefined = useWindowsStore().currentWindowForId(theWindows[i].cw.id || -1)
        const windowToMoveDown: chrome.windows.Window | undefined = useWindowsStore().currentWindowForId(theWindows[i - 1].cw.id || -1)

        console.log("windowToMoveDown", windowToMoveDown?.id)
        console.log("windowToMoveUp", windowToMoveUp?.id)

        const indexToSwitch = theWindows[i].index // element after
        console.log("found index to switch", indexToSwitch)

        console.log("setting", i, windowOriginalIndex)
        if (theWindows[i].windowFromStore) {
          // @ts-ignore
          theWindows[i].windowFromStore.index = windowOriginalIndex
        }

        console.log("setting", i - 1, indexToSwitch)
        if (theWindows[i - 1].windowFromStore) {
          // @ts-ignore
          theWindows[i - 1].windowFromStore.index = indexToSwitch
        }

        if (windowToMoveDown) {
          console.log("moving down", i)
          await useWindowsStore().upsertWindow(windowToMoveDown, theWindows[i].windowFromStore?.title, windowOriginalIndex)
        }
        if (windowToMoveUp) {
          await useWindowsStore().upsertWindow(windowToMoveUp, theWindows[i + 1].windowFromStore?.title, indexToSwitch)
        }

      }
      if (foundRow) {
        break
      }

    }

  }

  async function updateWindowIndex(windowId: number, indexToUse: number) {
    console.log("updating window index", windowId, indexToUse)
    return storage.getWindow(windowId).then(w => {
      if (w) {
        w.index = indexToUse
        return storage.updateWindow(w)
      } else {
        return Promise.reject("window for #" + windowId + " not found")
      }
    })

  }

  return {
    initialize,
    initListeners,
    currentWindows,
    currentWindow,
    currentWindowName,
    windowFor,
    windowNameFor,
    currentWindowFor,
    addToWindowSet,
    windowSet,
    screenshotWindow,
    upsertWindow,
    removeWindow,
    openThrottledInWindow,
    removeWindowByTitle,
    refreshCurrentWindows,
    windowForId,
    currentWindowForId,
    moveWindowUp,
    moveWindowDown,
    updateWindowIndex
  }
})
