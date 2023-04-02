import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import ChromeApi from "src/services/ChromeApi";
import {useTabsStore} from "src/stores/tabsStore";
import {useSearchStore} from "src/stores/searchStore";
import {DeleteTabsetCommand} from "src/domain/tabsets/DeleteTabset";
import {MarkTabsetDeletedCommand} from "src/domain/tabsets/MarkTabsetDeleted";

describe('CreateTabsetCommand', () => {

  jest.setTimeout(10000)

  beforeEach(async () => {
    setActivePinia(createPinia())
    await useSearchStore().init()
    const request = indexedDB.open('db', INDEX_DB_VERSION);
    request.onupgradeneeded = async function () {
      await useJestHelper().dbInit(request)
    }
    await IndexedDbPersistenceService.init()
    process.env.MODE = "bex"
    chrome.tabs.query.mockImplementation(async (o: object) => [])
  })

  it('mark tabset deleted', async () => {
    const createTsCmd = new CreateTabsetCommand('emptyTabsetId', [])
    await createTsCmd.execute()
    const tabsets = useTabsStore().tabsets
    expect(tabsets.size).toBe(1)
    const ts = tabsets.values().next().value
    expect(ts.status).toBe("DEFAULT")

    const deleteTsCmd = new MarkTabsetDeletedCommand(ts.id)
    const res: any = await deleteTsCmd.execute()
    console.log("res", res)
    expect(res.message).toBe("Tabset was deleted")
    expect(res.undoCommand).not.toBe(null)
    expect(ts.status).toBe("DELETED")
  })

})
