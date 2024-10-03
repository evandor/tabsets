import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import ChromeApi from "src/app/BrowserApi";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand"
import {Tab} from "src/tabsets/models/Tab";
import {CreateTabsetCommand} from "src/tabsets/commands/CreateTabsetCommand";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useDB} from "src/services/usePersistenceService";
import {useSearchStore} from "src/search/stores/searchStore";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useContentService} from "src/content/services/ContentService";
import IndexedDbContentPersistence from "src/content/persistence/IndexedDbRequestPersistence";
import {DeleteTabCommand} from "src/tabsets/commands/DeleteTabCommand";

installQuasarPlugin();

vi.mock('vue-router')

async function createTabset() {
  const createTabsetResult = await new CreateTabsetCommand("new Tabset", []).execute()
  return createTabsetResult.result.tabset;
}

function createTabWithChromeTabId(tabId: string, chromeTab: chrome.tabs.Tab) {
  const t = new Tab(tabId, chromeTab);
  t.chromeTabId = 100
  return t
}

describe('DeleteTabCommand', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")
  const testDeChromeTab = ChromeApi.createChromeTabObject("title", "https://www.test.de", "favicon")

  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    // await IndexedDbPersistenceService.init("db")
    db = useDB(undefined).tabsetsIndexedDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    await useSearchStore().init()
    await useContentService().init(IndexedDbContentPersistence)

    const chromeMock = {
      tabs: {
        sendMessage: vi.fn((id: any, msg: any) => {
          return Promise.resolve({
            html: "some html",
            metas: {description: "Description"}
          })
        }),
      },
      runtime: {
        sendMessage: vi.fn(() => {
        })
      }
    };

    vi.stubGlobal('chrome', chromeMock);
  })

  afterEach(async () => {
    db.clear("tabsets")
    // db.clear("content")
  })

  it('deletes existing tab from tabset', async () => {
    const tabset = await createTabset()
    const tab = createTabWithChromeTabId("tabId1", skysailChromeTab)
    await new AddTabToTabsetCommand(tab, tabset).execute()

    const result = await new DeleteTabCommand(tab, tabset).execute()
    expect(result.message).toBe("Tab was deleted")
    // TODO
    //expect(useSearchStore().getIndex().size()).toBe(0)
    const content = await useContentService().getContent("tabId")
    expect(content).toBeUndefined()
  });


});
