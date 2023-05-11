import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
// Ordering of imports important!!
import {CopyTabsetCommand} from "src/domain/tabsets/CopyTabset";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import {useSearchStore} from "src/stores/searchStore";
import {Tabset} from "src/models/Tabset";
import {useTabsStore} from "src/stores/tabsStore";
import {uid} from "quasar";
import {Tab} from "src/models/Tab";
import ChromeApi from "src/services/ChromeApi";

describe('CopyTabsetCommand', () => {

  jest.setTimeout(10000)

  beforeEach(async () => {
    setActivePinia(createPinia())
    await useSearchStore().init()
    const request = indexedDB.open('db', INDEX_DB_VERSION);
    request.onupgradeneeded = async function () {
      await useJestHelper().dbInit(request)
    }
    await IndexedDbPersistenceService.init("db")
    process.env.MODE = "bex"
    chrome.tabs.query.mockImplementation(async (o: object) => [])
  })

  it('copies empty tabset', async () => {
    const originalTabset = new Tabset("original", "original", [])
    const cmd = new CopyTabsetCommand(originalTabset)
    const res: any = await cmd.execute()

    expect(res.message).toBe("Tabset has been copied")
    expect(res.result.replaced).toBe(false)
    expect(res.result.tabset.id.length).toBe(36)
    expect(res.result.tabset.name).toBe("original - Copy")
    expect(res.undoCommand).not.toBe(null)
    expect(res.result.tabset.tabs.length).toBe(0)
  })

  it('new tabset is selected', async () => {
    const originalTabset = new Tabset("original", "original", [])
    await new CopyTabsetCommand(originalTabset).execute()
    const currentTabset = useTabsStore().getCurrentTabset
    expect(currentTabset?.name).toBe("original - Copy")
  })


  it('creates copied tabset with tabs', async () => {
    const originalTabset = new Tabset("original", "original", [new Tab(uid(), ChromeApi.createChromeTabObject("title", "https://www.skysail.io",""))])
    const cmd = new CopyTabsetCommand(originalTabset)
    const res:any = await cmd.execute()
    expect(res.result.tabset.tabs.length).toBe(1)
  })

  // it('creation can be undone', async () => {
  //   const cmd = new CreateTabsetCommand('tabsetWithTabs', [ChromeApi.createChromeTabObject("title", "https://www.skysail.io","")])
  //   const res:any = await cmd.execute()
  //   const undoRes = await  res.undoCommand.execute()
  //
  //   expect(undoRes.message).toBe("Tabset was deleted again")
  //   expect(undoRes.undoCommand).not.toBe(null)
  // })
  //
  // it('unwanted character is replaced', async () => {
  //   await new CreateTabsetCommand('tabset%WithoutSpecialChar', []).execute()
  //   const tabsets = useTabsStore().tabsets
  //   expect(tabsets.size).toBe(1)
  //   const ts = tabsets.values().next().value
  //   expect(ts.name).toBe("tabsetWithoutSpecialChar")
  // })
  //
  // it('merge with existing tabset', async () => {
  //   const cmd = new CreateTabsetCommand('existingTabset',
  //     [ChromeApi.createChromeTabObject("title", "https://www.skysail.io","")])
  //   await cmd.execute()
  //   const cmd2 = new CreateTabsetCommand('existingTabset',
  //     [ChromeApi.createChromeTabObject("title", "https://www.heise.de","")])
  //
  //   const res:any = await cmd2.execute()
  //
  //   expect(res.message).toBe("Existing Tabset existingTabset can be updated now")
  //   expect(res.result.replaced).toBe(true)
  //   const tabsets = useTabsStore().tabsets
  //   expect(tabsets.size).toBe(1)
  //   const ts = tabsets.values().next().value
  //   expect(ts.name).toBe("existingTabset")
  //   expect(ts.tabs.length).toBe(2)
  // })
  //
  // // it('overwrite existing tabset', async () => {
  // //   // feature not yet implemented
  // // })
  //
  // it('new tabs are indexed', async () => {
  //   const cmd = new CreateTabsetCommand('tabsetWithTabs', [ChromeApi.createChromeTabObject("title", "https://www.skysail.io","")])
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
