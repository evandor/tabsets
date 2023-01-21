import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import {CreateTabsetCommand} from "src/domain/commands/CreateTabsetCommand";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import LoggingService from "src/services/LoggingService";

describe('CreateTabsetCommand', () => {

  jest.setTimeout(10000)

  beforeEach(() => {
    setActivePinia(createPinia())
    LoggingService.init()
    const request = indexedDB.open('db', INDEX_DB_VERSION);
    request.onupgradeneeded = async function () {
      await useJestHelper().dbInit(request)
    }
  })

  it('creates new empty tabset', async () => {
    await IndexedDbPersistenceService.init()
    process.env.MODE = "bex"
    chrome.tabs.query.mockImplementation(async (o: object) => [])
    const cmd = new CreateTabsetCommand('emptyTabsetId', [])
    const res = await cmd.execute()
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
