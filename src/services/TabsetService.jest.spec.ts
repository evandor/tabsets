// @ts-ignore
import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {setActivePinia, createPinia} from 'pinia'
import {useTabsStore} from "src/stores/tabsStore";
import {chrome} from 'jest-chrome'
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";

import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
jest.setTimeout(10000)

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

process.env.MODE = 'bex'

let tabsetsDbStore = null

describe('TabsetService', () => {

  beforeEach(() => {
    setActivePinia(createPinia())
    const request = indexedDB.open('db', 4);

    request.onupgradeneeded = async function () {
      const db = request.result;
      tabsetsDbStore = db.createObjectStore("tabsets");
      db.createObjectStore("content");
      db.createObjectStore("thumbnails");
      db.createObjectStore("mhtml");
      // store.createIndex("by_title", "title", {unique: true});
      // store.put({title: "Quarry Memories", author: "Fred", isbn: 123456});
      IndexedDbPersistenceService.init();
    }
  })

  // TODO needs to be executed first !?!
  it('is initialized ', async () => {
    await IndexedDbPersistenceService.init()
    const tabsStore = useTabsStore()
    await TabsetService.init()
    expect(tabsStore.tabs.length).toBe(0)
    expect(tabsStore.tabsets.size).toBe(0)
  })

  it('can create a new tabset', async () => {
    await IndexedDbPersistenceService.init()
    const tabsStore = useTabsStore()
    chrome.tabs.query.mockImplementation(async (o: object) => [{id: 2}])

    const res = await TabsetService.saveOrReplaceFromChromeTabs("TS1", [createChromeTab(1,'https://www.skysail.io')], false)

    expect(res['merged' as keyof object]).toBe(false)
    expect(res['replaced' as keyof object]).toBe(false)
    expect(tabsStore.tabsets.size).toBe(1)
    const keys = [...tabsStore.tabsets.keys()]
    const firstTabset = tabsStore.tabsets.get(keys[0])
    expect(firstTabset?.tabs.length).toBe(1)
    expect(firstTabset?.tabs[0].chromeTab.url).toBe('https://www.skysail.io')

  })

  it('can overwrite an existing tabset', async () => {
    await IndexedDbPersistenceService.init()
    const tabsStore = useTabsStore()
    chrome.tabs.query.mockImplementation(async (o: object) => [{id: 2}])
    await TabsetService.saveOrReplaceFromChromeTabs("TS1", [createChromeTab(1,'https://www.skysail.io')], false)

    const res = await TabsetService.saveOrReplaceFromChromeTabs("TS1", [createChromeTab(2,'https://www.pline.one')], false)

    expect(res['merged' as keyof object]).toBe(false)
    expect(res['replaced' as keyof object]).toBe(true)
    expect(tabsStore.tabsets.size).toBe(1)
    const keys = [...tabsStore.tabsets.keys()]
    const firstTabset = tabsStore.tabsets.get(keys[0])
    expect(firstTabset?.tabs.length).toBe(1)
    expect(firstTabset?.tabs[0].chromeTab.url).toBe('https://www.pline.one')
  })

  // it('can merge an existing tabset', async () => {
  //   const tabsStore = useTabsStore()
  //
  //   chrome.tabs.query.mockImplementation(async (o: object) => [{id: 2}])
  //   await TabsetService.saveOrReplaceFromChromeTabs("TS1", [createChromeTab(1,'https://www.skysail.io')], false)
  //
  //   const res = await TabsetService.saveOrReplaceFromChromeTabs("TS1", [createChromeTab(2,'https://www.pline.one')], true)
  //
  //   expect(res['merged' as keyof object]).toBe(true)
  //   expect(res['replaced' as keyof object]).toBe(true)
  //   expect(tabsStore.tabsets.size).toBe(1)
  //   const keys = [...tabsStore.tabsets.keys()]
  //   const firstTabset = tabsStore.tabsets.get(keys[0])
  //   expect(firstTabset?.tabs.length).toBe(2)
  //   expect(firstTabset?.tabs[0].chromeTab.url).toBe('https://www.skysail.io')
  //   expect(firstTabset?.tabs[1].chromeTab.url).toBe('https://www.pline.one')
  // })

})
