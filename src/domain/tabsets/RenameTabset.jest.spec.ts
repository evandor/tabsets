import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import {CreateTabsetCommand} from "src/domain/commands/CreateTabset";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import LoggingService from "src/services/LoggingService";
import {useTabsStore} from "src/stores/tabsStore";
import {useSearchStore} from "src/stores/searchStore";
import {MarkTabsetAsFavoriteCommand} from "src/domain/commands/MarkTabsetAsFavoriteCommand";
import {RenameTabsetCommand} from "src/domain/tabsets/RenameTabset"

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

  it('rename tabset', async () => {
    const createTsCmd = new CreateTabsetCommand('oldName', [])
    await createTsCmd.execute()
    const tabsets = useTabsStore().tabsets
    expect(tabsets.size).toBe(1)
    const ts = tabsets.values().next().value
    expect(ts.name).toBe("oldName")

    const favoriteCmd = new RenameTabsetCommand(ts.id, "new Name")
    const res: any = await favoriteCmd.execute()
    console.log("res", res)
    expect(res.message).toBe("Tabset was renamed")
    expect(res.undoCommand).not.toBe(null)
    expect(ts.name).toBe("new Name")
  })

})
