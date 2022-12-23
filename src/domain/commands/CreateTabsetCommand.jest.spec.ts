import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import {CreateTabsetCommand} from "src/domain/commands/CreateTabsetCommand";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";

describe('CreateTabsetCommand', () => {

  jest.setTimeout(10000)

  class Logger {
    info = (msg: string) => console.log("info", msg)
    debug = (msg: string) => console.debug("info", msg)

  }

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

  beforeEach(() => {
    setActivePinia(createPinia())
    //localStorageMock.clear()
    const request = indexedDB.open('db', INDEX_DB_VERSION);

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
    const cmd = new CreateTabsetCommand('emptyTabsetId', [])
    const res = await cmd.execute(new Logger())
    expect(res.message).toBe("Tabset emptyTabsetId created successfully")
    expect(res.undoCommand).not.toBe(null)
  })


  // it('creates tabset with tabs', async () => {
  //   await IndexedDbPersistenceService.init()
  //   process.env.MODE = "bex"
  //   chrome.tabs.query.mockImplementation(async (o: object) => [])
  //   const cmd = new CreateTabsetCommand('tabsetWithTabs', [createChromeTab(1, "https://www.skysail.io")])
  //   const res = await cmd.execute(new Logger())
  //   console.log("res", res)
  //   expect(res.message).toBe("Tabset tabsetWithTabs created successfully")
  //   expect(res.undoCommand).not.toBe(null)
  // })

})
