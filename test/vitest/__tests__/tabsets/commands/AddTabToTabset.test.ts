import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import ChromeApi from "src/services/ChromeApi";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand"
import {Tab} from "src/tabsets/models/Tab";
import {CreateTabsetCommand} from "src/tabsets/commands/CreateTabset";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useDB} from "src/services/usePersistenceService";
import {useSearchStore} from "src/search/stores/searchStore";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useContentService} from "src/content/services/ContentService";
import IndexedDbContentPersistence from "src/content/persistence/IndexedDbContentPersistence";

installQuasarPlugin();

vi.mock('vue-router')

describe('AddTabToTabsetCommand', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")
  const testDeChromeTab = ChromeApi.createChromeTabObject("title", "https://www.test.de", "favicon")

  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    // await IndexedDbPersistenceService.init("db")
    db = useDB(undefined).tabsetsIndexedDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init(db)
    await useSearchStore().init()
    await useContentService().init(IndexedDbContentPersistence)
  })

  afterEach(async () => {
    db.clear("tabsets")
    db.clear("content")
  })

  it('adding new tab to empty tabset', async () => {
    const createTabsetResult = await new CreateTabsetCommand("new Tabset", []).execute()
    const tabset = createTabsetResult.result.tabset

    const result = await new AddTabToTabsetCommand(new Tab("tabId", skysailChromeTab), tabset).execute()
    expect(result.message).toBe("Tab was added")

    const tabsetFromDB = useTabsetsStore().getTabset(tabset.id)
    console.log("tabsetFromDB", tabsetFromDB)
    // @ts-ignore
    expect(useSearchStore().getIndex().size()).toBe(1)

  });

  it('adding second tab to tabset', async () => {

    const createTabsetResult = await new CreateTabsetCommand("new Tabset1", []).execute()
    const tabset = createTabsetResult.result.tabset

    await new AddTabToTabsetCommand(new Tab("tabId1", skysailChromeTab), tabset).execute()
    const result = await new AddTabToTabsetCommand(new Tab("tabId2", testDeChromeTab), tabset).execute()
    expect(result.message).toBe("Tab was added")

    const tabsetFromDB = useTabsetsStore().getTabset("new Tabset")
    console.log("tabsetFromDB", tabsetFromDB)
  });

  // TODO
  // it('adding tab with content to tabset', async () => {
  //   const theTab = new Tab("tabId3", testDeChromeTab)
  //   await db.saveContent(theTab, "text", {}, "title", [])
  //
  //   const createdTabset = (await new CreateTabsetCommand("new Tabset2", []).execute()).result.tabset
  //
  //   const result = await new AddTabToTabsetCommand(theTab, createdTabset).execute()
  //   expect(result.message).toBe("Tab was added")
  //
  //   const tabsetFromDB = useTabsetsStore().getTabset(createdTabset.id)!
  //   console.log("tabsetFromDB", tabsetFromDB)
  //   expect(tabsetFromDB.tabs.length).toBe(1)
  //   expect(tabsetFromDB.name).toBe("new Tabset2")
  //   expect(tabsetFromDB.folders.length).toBe(0)
  //   // @ts-ignore
  //   expect(useSearchStore().getIndex().size()).toBe(1)
  // });

  // TODO
  // it('adding tab with content to tabset\'s subfolder', async () => {
  //   const theTab = new Tab("tabId3", testDeChromeTab)
  //   await db.saveContent(theTab, "text", {}, "title", [])
  //
  //   const createdTabset = (await new CreateTabsetCommand("new Tabset2", []).execute()).result.tabset
  //   const subfolder = (await new CreateFolderCommand("subfolder", [], createdTabset.id).execute()).result
  //
  //   const result = await new AddTabToTabsetCommand(theTab, createdTabset, subfolder).execute()
  //   expect(result.message).toBe("Tab was added")
  //
  //   const tabsetFromDB = useTabsetsStore().getTabset(createdTabset.id)!
  //   console.log("tabsetFromDB", tabsetFromDB)
  //   expect(tabsetFromDB.tabs.length).toBe(1)
  //   expect(tabsetFromDB.name).toBe("new Tabset2")
  //   expect(tabsetFromDB.folders.length).toBe(1)
  //   expect(tabsetFromDB.folders[0].name).toBe("subfolder")
  //   // @ts-ignore
  //   expect(useSearchStore().getIndex().size()).toBe(1)
  // });


});
