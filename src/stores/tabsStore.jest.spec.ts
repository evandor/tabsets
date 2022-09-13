import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {mount} from "@vue/test-utils";
import MyButton from "app/test/jest/__tests__/demo/MyButton.vue";
import {setActivePinia, createPinia} from 'pinia'
import {useTabsStore} from "src/stores/tabsStore";
import {LocalStorage, useQuasar} from "quasar";
import {chrome} from 'jest-chrome'
import {Tabset} from "src/models/Tabset";
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";

import _ from "lodash"

function createChromeTab(id: number, url: string) {
  return {
    id,
    url,
    index: 1,
    pinned: false,
    highlighted: false,
    windowId: 1,
    active: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: false
  }
}

function createTab(id: number, url: string): Tab {
  //@ts-ignore
  return new Tab("tabId" + id, createChromeTab(id, url))
}

describe('TabsStore', () => {

  const localStorageMock = (() => {
    let store = new Map<string, object>();
    return {
      getItem(key: string) {
        return store.get(key)
      },
      setItem(key: string, value: any) {
        //console.log("setItem", key)
        store.set(key, value)
      },
      set(key: string, value: any) {
        //console.log("set", key)
        store.set(key, value)
      },
      clear() {
        store = new Map<string, object>();
      },
      removeItem(key: string) {
        store.delete(key)
      },
      getAllKeys(): string[] {
        //console.log("getting keys of", store.keys())
        return [...store.keys()]
      }
    };
  })();

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  it('tabs are initialized from chrome.tabs', async () => {
    const tabsStore = useTabsStore()
    chrome.tabs.query.mockImplementation(async (o: object) => [{}])

    await tabsStore.initialize(localStorageMock)

    expect(tabsStore.tabs.length).toBe(1)
    expect(tabsStore.tabsets.size).toBe(1)
  })

  it('tabsets are initialized from local storage when there is no contextId', async () => {
    const tabsStore = useTabsStore()
    chrome.tabs.query.mockImplementation(async (o: object) => [])
    localStorageMock.setItem("tabsets.tabset.A", new Tabset("tsIdA", "tsNameA", []))
    localStorageMock.setItem("tabsets.tabset.B", new Tabset("tsIdB", "tsNameB", []))

    await tabsStore.initialize(localStorageMock)

    expect(tabsStore.tabs.length).toBe(0)
    expect(tabsStore.tabsets.size).toBe(3)
    expect(tabsStore.contextId).toBe(null)
    expect(tabsStore.currentTabsetId).toBe("current")
  });

  it('tabsets are initialized from local storage when there is a contextId', async () => {
    const tabsStore = useTabsStore()
    chrome.tabs.query.mockImplementation(async (o: object) => [])
    localStorageMock.setItem("tabsets.context", "A")
    localStorageMock.setItem("tabsets.tabset.A", new Tabset("tsIdA", "tsNameA", []))
    localStorageMock.setItem("tabsets.tabset.B", new Tabset("tsIdB", "tsNameB", []))

    await tabsStore.initialize(localStorageMock)

    expect(tabsStore.tabs.length).toBe(0)
    expect(tabsStore.tabsets.size).toBe(3)
    expect(tabsStore.contextId).toBe("tsIdA")
    expect(tabsStore.currentTabsetId).toBe("tsIdA")
  });

  it('creates new tabset', async () => {
    const tabsStore = useTabsStore()
    chrome.tabs.query.mockImplementation(async (o: object) => [])
    await tabsStore.initialize(localStorageMock)
    TabsetService.setLocalStorage(localStorageMock)

    await tabsStore.updateOrCreateTabset("newTabset")

    expect(tabsStore.tabsets.size).toBe(2) // the new one plus 'current'
    //expect(tabsStore.contextId.length).toBe(36) // an uid
    //expect(tabsStore.currentTabsetId).toBe(tabsStore.contextId)
  });

  it('saves existing tabset with overwrite', async () => {
    const tabsStore = useTabsStore()
    chrome.tabs.query.mockImplementation(async (o: object) => [])

    localStorageMock.setItem("tabsets.tabset.existingTsId", new Tabset("existingTsId", "existingTsName", []))
    await tabsStore.initialize(localStorageMock)
    TabsetService.setLocalStorage(localStorageMock)

    await tabsStore.updateOrCreateTabset("existingTsName")

    expect(tabsStore.tabsets.size).toBe(2) // the new one plus 'current'
    //expect(tabsStore.contextId).toBe('existingTsId') // an uid
    //expect(tabsStore.currentTabsetId).toBe(tabsStore.contextId)
  });

  it('saves existing tabset with merge', async () => {
    const tabsStore = useTabsStore()
    chrome.tabs.query.mockImplementation(async (o: object) => [
      createChromeTab(10, 'https://www.skysail.io'),
      createChromeTab(20, 'https://www.mozilla.org')
    ])

    localStorageMock.setItem("tabsets.tabset.existingTsId", new Tabset("existingTsId", "existingTsName", [
      createTab(1, 'https://www.skysail.io'),
      createTab(2, 'https://www.test.de')
    ]))
    await tabsStore.initialize(localStorageMock)
    TabsetService.setLocalStorage(localStorageMock)

    await tabsStore.updateOrCreateTabset("existingTsName", true)

    expect(tabsStore.tabsets.size).toBe(2) // the new one plus 'current'
    //expect(tabsStore.contextId).toBe('existingTsId') // an uid
    //expect(tabsStore.currentTabsetId).toBe(tabsStore.contextId)
    //expect(tabsStore.getCurrentTabs.length).toBe(3)
    //expect(_.map(tabsStore.getCurrentTabs, t => t.chromeTab.id)).toEqual([1, 2, 20])
  });
})
