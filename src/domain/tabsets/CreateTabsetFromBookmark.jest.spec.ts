import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import "fake-indexeddb/auto"
// needs to be listed before IndexedDbPersistenceService!
import {CreateTabsetFromBookmarksCommand} from "src/domain/tabsets/CreateTabsetFromBookmarks";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import LoggingService from "src/services/LoggingService";
import ChromeApi from "src/services/ChromeApi";
import {useTabsStore} from "src/stores/tabsStore";
import {useSearchStore} from "src/stores/searchStore";

describe('CreateTabsetFromBookmarkCommand', () => {

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

  it('creates new empty tabset from bookmarks folder', async () => {
    const cmd = new CreateTabsetFromBookmarksCommand('emptyTabsetFromBookmarksId', [])
    const res:any = await cmd.execute()

    expect(res.message).toBe("Tabset emptyTabsetFromBookmarksId created successfully from bookmarks folder")
    expect(res.result.replaced).toBe(false)
    expect(res.result.tabsetId.length).toBe(36)
    expect(res.undoCommand).not.toBe(null)
  })

  it('new tabset is selected', async () => {
    await new CreateTabsetFromBookmarksCommand('emptyTabsetName', []).execute()
    const currentTabset = useTabsStore().getCurrentTabset
    expect(currentTabset?.name).toBe("emptyTabsetName")
  })


  it('creates tabset with tabs from bookmarks', async () => {
    const cmd = new CreateTabsetFromBookmarksCommand('tabsetWithTabs', [ChromeApi.createChromeBookmarkObject("title", "https://www.skysail.io","")])
    const res:any = await cmd.execute()
    expect(res.message).toBe("Tabset tabsetWithTabs created successfully from bookmarks folder")
    expect(res.result.replaced).toBe(false)
    expect(res.result.tabsetId.length).toBe(36)
    expect(res.undoCommand).not.toBe(null)
  })

  it('creation can be undone', async () => {
    const cmd = new CreateTabsetFromBookmarksCommand('tabsetWithTabs', [ChromeApi.createChromeBookmarkObject("title", "https://www.skysail.io","")])
    const res:any = await cmd.execute()
    const undoRes = await  res.undoCommand.execute()

    expect(undoRes.message).toBe("1 Tab(s) were deleted again")
    expect(undoRes.undoCommand).not.toBe(null)
  })

  // it('unwanted character is replaced', async () => {
  //   await new CreateTabsetFromBookmarksCommand('tabset%WithoutSpecialChar', []).execute()
  //   const tabsets = useTabsStore().tabsets
  //   expect(tabsets.size).toBe(1)
  //   const ts = tabsets.values().next().value
  //   expect(ts.name).toBe("tabsetWithoutSpecialChar")
  // })

  it('merge with existing tabset', async () => {
    const cmd = new CreateTabsetFromBookmarksCommand('existingTabset',
      [ChromeApi.createChromeBookmarkObject("title", "https://www.skysail.io","")])
    await cmd.execute()
    const cmd2 = new CreateTabsetFromBookmarksCommand('existingTabset',
      [ChromeApi.createChromeBookmarkObject("title", "https://www.heise.de","")])

    const res:any = await cmd2.execute()

    expect(res.message).toBe("Existing Tabset existingTabset was updated")
    expect(res.result.replaced).toBe(true)
    const tabsets = useTabsStore().tabsets
    expect(tabsets.size).toBe(1)
    const ts = tabsets.values().next().value
    expect(ts.name).toBe("existingTabset")
    expect(ts.tabs.length).toBe(2)
  })

  // it('overwrite existing tabset', async () => {
  //   // feature not yet implemented
  // })

  // it('new tabs are indexed', async () => {
  //   const cmd = new CreateTabsetFromBookmarksCommand('tabsetWithTabs', [ChromeApi.createChromeBookmarkObject("title", "https://www.skysail.io","")])
  //   await cmd.execute()
  //
  //   const fuseIndex = useSearchStore().getIndex()
  //   // @ts-ignore
  //   const records = fuseIndex.records
  //   // const str = JSON.stringify(fuseIndex.records[0].$)
  //   expect(records[0].$[1]['v']).toBe("title")
  //   expect(records[0].$[2]['v']).toBe("https://www.skysail.io")
  // })
})
