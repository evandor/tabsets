import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useDB} from "src/services/usePersistenceService";
import PersistenceService from "src/services/PersistenceService";
import {useTabsetService} from "src/services/TabsetService2";
import {useWindowsStore} from "stores/windowsStore";
import ChromeApi from "src/services/ChromeApi";

installQuasarPlugin();

vi.mock('vue-router')

let onCreatedListener = null as unknown as ((window: chrome.windows.Window) => Promise<void>)
let onRemovedListener = null as unknown as ((windowId: number) => Promise<void>)
let onFocusChangedListener = null as unknown as ((windowId: number) => Promise<void>)

async function setupMocksAndStores(
  currentWindows: any[],
  currentWindow: any,
  db: PersistenceService
) {

  // https://groups.google.com/a/chromium.org/g/chromium-extensions/c/hssoAlvluW8
  const chromeMock = {
    windows: {
      getAll: vi.fn((options, callback) => {
        console.log("mocking chrome.windows.getAll")
        //callback(currentWindows);
        return Promise.resolve(currentWindows)
      }),
      getCurrent: vi.fn((options, callback) => {
        //console.log("mocking chrome.windows.getCurrent")
        callback(currentWindow)
      }),
      getLastFocused: vi.fn((options, callback) => {
        //console.log("mocking chrome.windows.getLastFocused")
        callback(currentWindow)
      }),
      get: vi.fn((windowId, queryOptions, callback) => {
        console.log("mocking chrome.windows.get", windowId, queryOptions)
        currentWindow.left = 33
        return currentWindow
      }),
      onCreated: {
        addListener: vi.fn((listener) => {
          //console.log("mocking chrome.windows.onCreated.addListener", listener)
          onCreatedListener = listener
        })
      },
      onRemoved: {
        addListener: vi.fn((listener) => {
          //console.log("mocking chrome.windows.onRemoved.addListener", listener)
          onRemovedListener = listener
        })
      },
      onFocusChanged: {
        addListener: vi.fn((listener) => {
          //console.log("mocking chrome.windows.onFocusChanged.addListener", listener)
          onFocusChangedListener = listener
        })
      },
      onBoundsChanged: {
        addListener: vi.fn((listener) => {
          //console.log("mocking chrome.windows.onBoundsChanged.addListener", listener)
          //callback(undefined)
        })
      }
    },
    runtime: {
      sendMessage: vi.fn(() => {
      })
    }
  };

  vi.stubGlobal('chrome', chromeMock);

  await useWindowsStore().initialize(db)
  useWindowsStore().initListeners()
}

describe('WindowsStore', () => {

  let db = null as unknown as PersistenceService

  const tab1 = ChromeApi.createChromeTabObject("skysail", "https://www.skysail.io")
  const tab2 = ChromeApi.createChromeTabObject("tabsets", "https://www.tabsets.net")

  const window100:chrome.windows.Window = ChromeApi.createChromeWindowObject(100, 17, 28, [tab1, tab2])
  const window200:chrome.windows.Window = ChromeApi.createChromeWindowObject(200, 17, 28, [tab2])

  const currentWindows = [window100, window200]

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbPersistenceService.init("db")
    db = useDB(undefined).db
    await useTabsetService().init(db)
  })

  afterEach(async () => {
    db.clear("tabsets")
    db.clear("windows")
  })

  it('initializing correctly with multiple windows and indices differing', async () => {

    await setupMocksAndStores(currentWindows, window100, db)

    const windows = await db.getWindows()
    expect(windows.length).toBe(2)
    expect(windows[0].id).toBe(100)
    expect(windows[1].id).toBe(200)

    const window = await db.getWindow(100)
    expect(window?.id).toBe(100)
    expect(window?.index).toBe(0)
    expect(window?.hostList).toStrictEqual(new Set(['www.skysail.io','www.tabsets.net']))
    expect(useWindowsStore().currentWindow.id).toBe(100)

    const window200 = await db.getWindow(200)
    expect(window200?.id).toBe(200)
    expect(window200?.index).toBe(1)
    expect(window200?.hostList).toStrictEqual(new Set(['www.tabsets.net']))

  })

  it('upsertWindow saves new title', async () => {
    await setupMocksAndStores(currentWindows, window100, db)
    const window = await db.getWindow(100)
    if (window) {
      await useWindowsStore().upsertWindow(window.browserWindow, "theTitle")
      const updatedWindow = await db.getWindow(100)
      expect(updatedWindow?.title).toBe("theTitle")
    } else {
      expect(true).toBeFalsy()
    }
  })

  it('onRemoved does not remove window with title', async () => {
    await setupMocksAndStores(currentWindows, window100, db)
    const window = await db.getWindow(100)
    if (window) {
      await useWindowsStore().upsertWindow(window.browserWindow, "theTitle")
      await onRemovedListener(100)
      const window100FromDb = await db.getWindow(100)
      expect(window100FromDb?.id).toBe(100)
    } else {
      expect(true).toBeFalsy()
    }
  })

  it('onFocusChanged updates browserWindow', async () => {
    await setupMocksAndStores(currentWindows, window100, db)
    await onFocusChangedListener(100)
    const window100FromDb = await db.getWindow(100)
    // 33 is a 'magic number' assigned
    expect(window100FromDb?.browserWindow.left).toBe(33)
  })

  it('onCreate', async () => {
    const window: chrome.windows.Window = ChromeApi.createChromeWindowObject(1000, 0, 0)
    await setupMocksAndStores(currentWindows.concat(window), window100, db)
    await onCreatedListener(window)
    // await useWindowsStore().persistGroup(ChromeApi.createChromeTabGroupObject(1, "groupName", 'grey' as chrome.tabGroups.ColorEnum))
    //const groups = await  db.getGroups()
    // expect(groups.length).toBe(1)
    const window1000FromDb = await db.getWindow(1000)
    expect(window1000FromDb?.id).toBe(1000)
    expect(window1000FromDb?.browserWindow.left).toBe(0)
    expect(window1000FromDb?.index).toBe(2)
  })

  // it('persists group with changing title', async () => {
  //     await useGroupsStore().initialize(db)
  //     await useGroupsStore().persistGroup(ChromeApi.createChromeTabGroupObject(1, "ab", 'grey' as chrome.tabGroups.ColorEnum))
  //     await useGroupsStore().persistGroup(ChromeApi.createChromeTabGroupObject(1, "abc", 'grey' as chrome.tabGroups.ColorEnum))
  //
  //     const groups = await  db.getGroups()
  //     expect(groups.length).toBe(1)
  //     expect(groups[0].title).toBe("abc")
  // })


});
