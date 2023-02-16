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
 import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
 import {Tab} from "src/models/Tab";
 import {uid} from "quasar";
 import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";

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
    var newTabsetRes:any  = await new CreateTabsetCommand('emptyTabsetId', []).execute()
    await new SelectTabsetCommand(newTabsetRes.result['tabset']['id']).execute()
    var testTab: Tab = new Tab(uid(), ChromeApi.createChromeTabObject("title", "https://www.skysail.io",""))
    const res:any = await new CreateTabFromOpenTabsCommand(testTab, 0, "group").execute()
    expect(res.message).toBe("Tab was added")
  })


})
