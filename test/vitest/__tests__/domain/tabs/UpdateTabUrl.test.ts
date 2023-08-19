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
import {UpdateTabUrlCommand} from "src/domain/tabs/UpdateTabUrl";

installQuasarPlugin();

vi.mock('vue-router')

describe('UpdateTabUrl', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")

  let db = null as unknown as typeof IndexedDbPersistenceService

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbPersistenceService.init("db")
    db = useDB(undefined).db
  })

  afterEach(async () => {
    db.clear("tabsets")
  })

  it('updating url changes url', async () => {
    const createTabsetResult = await new CreateTabsetCommand("new Tabset", []).execute()
    const tabset = createTabsetResult.result.tabset
    const tab = new Tab("tabId", skysailChromeTab)
    await new AddTabToTabsetCommand(tab, tabset).execute()

    const result = await new UpdateTabUrlCommand(tab, "https://skysail.io").execute()
    expect(result.message).toBe("Tab's URL was updated")
    expect(result.result).toBe("https://skysail.io")

    const tabsetFromDB = useTabsetService().getTabset(createTabsetResult.result.tabset.id)
    expect(tabsetFromDB?.tabs[0].url).toBe("https://skysail.io")
  });

  it('updating url and reverting does not change url', async () => {
    const createTabsetResult = await new CreateTabsetCommand("new Tabset", []).execute()
    const tabset = createTabsetResult.result.tabset
    const tab = new Tab("tabId", skysailChromeTab)
    await new AddTabToTabsetCommand(tab, tabset).execute()

    const result = await new UpdateTabUrlCommand(tab, "https://skysail.io").execute()
    await result.undoCommand?.execute()

    const tabsetFromDB = useTabsetService().getTabset(createTabsetResult.result.tabset.id)
    expect(tabsetFromDB?.tabs[0].url).toBe("https://www.skysail.io")
  });






});
