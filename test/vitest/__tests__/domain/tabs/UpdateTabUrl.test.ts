import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import ChromeApi from "src/app/BrowserApi";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand"
import {Tab} from "src/tabsets/models/Tab";
import {CreateTabsetCommand} from "src/tabsets/commands/CreateTabsetCommand";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useDB} from "src/services/usePersistenceService";
import {UpdateTabCommand} from "src/domain/tabs/UpdateTabCommand";
import {useSearchStore} from "src/search/stores/searchStore";
import IndexedDbTabsetsPersistence from "src/tabsets/persistence/IndexedDbTabsetsPersistence";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useContentService} from "src/content/services/ContentService";
import IndexedDbContentPersistence from "src/content/persistence/IndexedDbContentPersistence";

installQuasarPlugin();

vi.mock('vue-router')

describe('UpdateTabUrl', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")

  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbTabsetsPersistence.init()
    await IndexedDbContentPersistence.init()
    await useContentService().init(IndexedDbContentPersistence)
    db = useDB().tabsetsIndexedDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    await useSearchStore().init()
  })

  afterEach(async () => {
    db.clear("tabsets")
  })

  it('updating url changes url', async () => {
    const createTabsetResult = await new CreateTabsetCommand("new Tabset", []).execute()
    const tabset = createTabsetResult.result.tabset
    const tab = new Tab("tabId", skysailChromeTab)
    await new AddTabToTabsetCommand(tab, tabset).execute()

    const result = await new UpdateTabCommand(
        tab, "https://skysail.io", "newName", "").execute()
    expect(result.message).toBe("Tab updated")
    expect(result.result).toBe("https://skysail.io")

    const tabsetFromDB = useTabsetsStore().getTabset(createTabsetResult.result.tabset.id)
    expect(tabsetFromDB?.tabs[0].url).toBe("https://skysail.io")
  });

  it('updating url and reverting does not change url', async () => {
    const createTabsetResult = await new CreateTabsetCommand("new Tabset", []).execute()
    const tabset = createTabsetResult.result.tabset
    const tab = new Tab("tabId", skysailChromeTab)
    await new AddTabToTabsetCommand(tab, tabset).execute()

    const result = await new UpdateTabCommand(
        tab, "https://skysail.io", "newName", "").execute()
    await result.nextCommands.values().next().value?.execute()

    const tabsetFromDB = useTabsetsStore().getTabset(createTabsetResult.result.tabset.id)
    expect(tabsetFromDB?.tabs[0].url).toBe("https://www.skysail.io")
  });






});
