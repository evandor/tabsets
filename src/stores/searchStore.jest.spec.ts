import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import LoggingService from "src/services/LoggingService";
import ChromeApi from "src/services/ChromeApi";
import {useSearchStore} from "src/stores/searchStore";
import {Tab} from "src/models/Tab";
import {UpdateTabNameCommand} from "src/domain/tabs/UpdateTabName";



function indexAt(pos: number, ident: string) {
  let key = '?'
  switch (ident) {
    case 'name': key = '0'; break;
    case 'title': key = '1'; break;
    case 'url': key = '2'; break;
    case 'description': key = '3'; break;
    case 'keywords': key = '4'; break;
    case 'content': key = '5'; break;
  }
  return useSearchStore().getIndex().toJSON()['records'][pos]['$' as keyof object][key]
}


function createTab(id: number, url: string): Tab {
  //@ts-ignore
  return new Tab("tabId" + id, createChromeTab(id, url))
}

process.env.MODE = 'bex'

describe('SearchStore', () => {

  beforeEach(async () => {
    setActivePinia(createPinia())
    await LoggingService.init()
    const request = indexedDB.open('db', INDEX_DB_VERSION);
    request.onupgradeneeded = async function () {
      await useJestHelper().dbInit(request)
    }
    await IndexedDbPersistenceService.init()
  })

  it('populate with empty content promise', async () => {
    await useSearchStore().populate(Promise.resolve([]))
    // @ts-ignore
    expect(useSearchStore().getIndex().size()).toBe(0)
  })

  it('populate with a content promise', async () => {

    const searchStore = useSearchStore()

    const content = {
      id: 'aHR0cHM6Ly93d3cuYXJkLmRlLw==', expires: 0, title: 'ARD', url: 'https://www.ard.de/',
      content: 'ard content'}

    await searchStore.populate(Promise.resolve([content]))

    // @ts-ignore
    expect(useSearchStore().getIndex().size()).toBe(1)
    expect(indexAt(0,'name')).toEqual(undefined)
    expect(indexAt(0,'title')).toEqual({"n": 1, "v": "ARD"})
    expect(indexAt(0,'url')).toEqual({"n": 1, "v": "https://www.ard.de/"})
    expect(indexAt(0,'description')).toEqual(undefined)
    expect(indexAt(0,'keywords')).toEqual(undefined)
    expect(indexAt(0,'content')).toEqual({"n": 0.707, "v": "ard content"})
  })

  it('populate with content and from tabsets with different url', async () => {

    const content = {
      id: 'aHR0cHM6Ly93d3cuYXJkLmRlLw==', expires: 0, title: 'ARD', url: 'https://www.ard.de/',
      content: 'ard content'}
    const aTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "")
    await new CreateTabsetCommand("tabsetName", [aTab]).execute()

    await useSearchStore().populate(Promise.resolve([content]))

    // @ts-ignore
    expect(useSearchStore().getIndex().size()).toBe(2)

    //expect(indexAt(0,'name')).toEqual(undefined)
    expect(indexAt(0,'title')).toEqual({"n": 1, "v": "ARD"})
    expect(indexAt(0,'url')).toEqual({"n": 1, "v": "https://www.ard.de/"})
    expect(indexAt(0,'description')).toEqual(undefined)
    expect(indexAt(0,'keywords')).toEqual(undefined)
    expect(indexAt(0,'content')).toEqual({"n": 0.707, "v": "ard content"})

    expect(indexAt(1,'name')).toEqual(undefined)
    expect(indexAt(1,'title')).toEqual({"n": 1, "v": "title"})
    expect(indexAt(1,'url')).toEqual({"n": 1, "v": "https://www.skysail.io"})
    expect(indexAt(1,'description')).toEqual(undefined)
    expect(indexAt(1,'keywords')).toEqual(undefined)
    expect(indexAt(1,'content')).toEqual(undefined)
  })

  it('populate with content and from tabsets with same url', async () => {

    const content = {
      id: 'aHR0cHM6Ly93d3cuYXJkLmRlLw==', expires: 0, title: 'ARD', url: 'https://www.zdf.de/',
      content: 'zdf content'}
    const aTab = ChromeApi.createChromeTabObject("title from tab", "https://www.zdf.de/", "")
    const res = await new CreateTabsetCommand("tabsetName", [aTab]).execute()
    // @ts-ignore
    await new UpdateTabNameCommand(res.result.tabset.tabs[0], "custom name").execute()


    await useSearchStore().populate(Promise.resolve([content]))

    // @ts-ignore
    expect(useSearchStore().getIndex().size()).toBe(1)

    expect(indexAt(0,'name')).toEqual({"n": 0.707, "v": "custom name"})
    expect(indexAt(0,'title')).toEqual({"n": 0.577, "v": "title from tab"})
    expect(indexAt(0,'url')).toEqual({"n": 1, "v": "https://www.zdf.de/"})
    expect(indexAt(0,'description')).toEqual(undefined)
    expect(indexAt(0,'keywords')).toEqual(undefined)
    expect(indexAt(0,'content')).toEqual({"n": 0.707, "v": "zdf content"})
  })

})
