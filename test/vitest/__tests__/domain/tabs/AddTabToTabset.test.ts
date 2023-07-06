import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import ChromeApi from "src/services/ChromeApi";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import {Tab} from "src/models/Tab";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import {useTabsetService} from "src/services/TabsetService2";
import {useDB} from "src/services/usePersistenceService";

installQuasarPlugin();

vi.mock('vue-router')

describe('AddTabToTabsetCommand', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")
  const testDeChromeTab = ChromeApi.createChromeTabObject("title", "https://www.test.de", "favicon")

  let db = null as unknown as typeof IndexedDbPersistenceService

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbPersistenceService.init("db")
    db = useDB(undefined).db
  })

  afterEach(async () => {
    db.clear("tabsets")
    db.clear("tabs")
  })

  it('adding new tab to empty tabset', async () => {

    const createTabsetResult = await new CreateTabsetCommand("new Tabset", []).execute()
    const tabset = createTabsetResult.result.tabset

    const result = await new AddTabToTabsetCommand(new Tab("tabId", skysailChromeTab), tabset).execute()
    expect(result.message).toBe("Tab was added")

    const tabsetFromDB = useTabsetService().getTabset("new Tabset")
    console.log("tabsetFromDB", tabsetFromDB)
  });

  it('adding second tab to tabset', async () => {

    const createTabsetResult = await new CreateTabsetCommand("new Tabset1", []).execute()
    const tabset = createTabsetResult.result.tabset

    await new AddTabToTabsetCommand(new Tab("tabId1", skysailChromeTab), tabset).execute()
    const result = await new AddTabToTabsetCommand(new Tab("tabId2", testDeChromeTab), tabset).execute()
    expect(result.message).toBe("Tab was added")

    const tabsetFromDB = useTabsetService().getTabset("new Tabset")
    console.log("tabsetFromDB", tabsetFromDB)
  });


});
