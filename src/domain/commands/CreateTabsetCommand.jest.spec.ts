import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import {CreateTabsetCommand} from "src/domain/commands/CreateTabsetCommand";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";

describe('CreateTabsetCommand', () => {

  jest.setTimeout(10000)

  class Logger {
    info = (msg: string) => {
      console.log("info", msg)
    }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    //localStorageMock.clear()
    const request = indexedDB.open('db', 5);

    request.onupgradeneeded = async function () {
      const db = request.result;
      //tabsetsDbStore =
      db.createObjectStore("tabsets");
      db.createObjectStore("content");
      db.createObjectStore("thumbnails");
      db.createObjectStore("mhtml");
      // store.createIndex("by_title", "title", {unique: true});
      // store.put({title: "Quarry Memories", author: "Fred", isbn: 123456});
      //IndexedDbPersistenceService.init();
    }
  })

  it('creates new empty tabset', async () => {
    await IndexedDbPersistenceService.init()
    process.env.MODE = "bex"
    chrome.tabs.query.mockImplementation(async (o: object) => [])
    //chrome.tabs.getCurrent.mockImplementation(async () => Promise<void>)
    const cmd = new CreateTabsetCommand('tsid', [])
    const res = await cmd.execute(new Logger())
    console.log("res", res)
    expect(res.message).toBe("Tabset tsid created successfully")
    expect(res.undoCommand).not.toBe(null)
    // const tabsStore = useTabsStore()
    // chrome.tabs.query.mockImplementation(async (o: object) => [{id: 1}])
    //
    // await tabsStore.initialize(localStorageMock)
    //
    // expect(tabsStore.tabs.length).toBe(1)
    // expect(tabsStore.tabsets.size).toBe(0)
  })

})
