 import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import LoggingService from "src/services/LoggingService";
import {useSearchStore} from "src/stores/searchStore";
 import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";
 import {useTabsStore} from "src/stores/tabsStore";

describe('CreateTabsetCommand', () => {

  jest.setTimeout(10000)

  beforeEach(async () => {
    setActivePinia(createPinia())
    await LoggingService.init()
    await useSearchStore().init()
    const request = indexedDB.open('db', INDEX_DB_VERSION);
    request.onupgradeneeded = async function () {
      await useJestHelper().dbInit(request)
    }
    await IndexedDbPersistenceService.init()
    process.env.MODE = "bex"
    chrome.tabs.query.mockImplementation(async (o: object) => [])
  })

  it('adds new Tab to existing tabset', async () => {
    const newTabsetRes: any = await new CreateTabsetCommand('emptyTabsetId', []).execute()
    const res:any = await new SelectTabsetCommand(newTabsetRes.result['tabsetId']).execute()
    expect(res.message).toBe("done")
    expect(useTabsStore().currentTabsetId).toBe(newTabsetRes.result['tabsetId'])
  })


})
