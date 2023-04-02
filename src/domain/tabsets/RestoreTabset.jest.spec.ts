import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import {useTabsStore} from "src/stores/tabsStore";
import {useSearchStore} from "src/stores/searchStore";
import {RestoreTabsetCommand} from "src/domain/tabsets/RestoreTabset"

describe('RestoreTabsetCommand', () => {

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

  it('restore tabset', async () => {
    const createTsCmd = new CreateTabsetCommand('theTabset', [])
    await createTsCmd.execute()
    const tabsets = useTabsStore().tabsets
    const ts = tabsets.values().next().value

    const favoriteCmd = new RestoreTabsetCommand(ts.id, true)
    const res: any = await favoriteCmd.execute()
    expect(res.message).toBe("doneMsg")
    expect(res.undoCommand).not.toBe(null)
  })

})
