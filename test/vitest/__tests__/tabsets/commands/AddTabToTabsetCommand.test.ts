import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { uid } from 'quasar'
import ChromeApi from 'src/app/BrowserApi'
import IndexedDbContentPersistence from 'src/content/persistence/IndexedDbContentPersistence'
import { useContentService } from 'src/content/services/ContentService'
import BexFunctions from 'src/core/communication/BexFunctions'
import { useSearchStore } from 'src/search/stores/searchStore'
import { useDB } from 'src/services/usePersistenceService'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { CreateFolderCommand } from 'src/tabsets/commands/CreateFolderCommand'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

vi.mock('vue-router')

async function createTabset() {
  const createTabsetResult = await new CreateTabsetCommand('new Tabset', []).execute()
  return createTabsetResult.result.tabset
}

function createTabWithChromeTabId(tabId: string, chromeTab: chrome.tabs.Tab) {
  const t = new Tab(tabId, chromeTab)
  t.chromeTabId = 100
  return t
}

describe('AddTabToTabsetCommand', () => {
  const skysailChromeTab = ChromeApi.createChromeTabObject('title', 'https://www.skysail.io', 'favicon')
  const testDeChromeTab = ChromeApi.createChromeTabObject('title', 'https://www.test.de', 'favicon')

  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    // await IndexedDbPersistenceService.init("db")
    db = useDB(undefined).tabsetsIndexedDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    await useSearchStore().init()
    await useContentService().init(IndexedDbContentPersistence)

    await BexFunctions.handleBexTabExcerpt({
      from: '',
      to: '',
      event: '',
      payload: {
        html: 'some html',
        metas: { description: 'Description' },
      },
    })
  })

  afterEach(async () => {
    db.clear('tabsets')
    // db.clear("content")
  })

  it('adding new tab to empty tabset', async () => {
    const tabset = await createTabset()

    const tab = createTabWithChromeTabId('tabId', skysailChromeTab)
    const result = await new AddTabToTabsetCommand(tab, tabset).execute()

    expect(result.message).toBe('Link was added')
    const tabsetFromDB = useTabsetsStore().getTabset(tabset.id)
    expect(tabsetFromDB!.tabs.length).toBe(1)
    expect(tabsetFromDB!.tabs[0]!.id).toBe('tabId')
    expect(useSearchStore().getIndex().size()).toBe(1)
    const content = await useContentService().getContent('tabId')
    expect(content!.content).toBe('some html')
    expect(content!.metas['description' as keyof object]).toBe('Description')
  })

  it('adding second tab to tabset', async () => {
    const tabset = await createTabset()
    await new AddTabToTabsetCommand(createTabWithChromeTabId('tabId1', skysailChromeTab), tabset).execute()
    await new AddTabToTabsetCommand(createTabWithChromeTabId('tabId2', testDeChromeTab), tabset).execute()

    const tabsetFromDB = useTabsetsStore().getTabset(tabset.id)
    console.log('tabsetFromDB', tabsetFromDB)
    expect(tabsetFromDB!.tabs.length).toBe(2)
    expect(useSearchStore().getIndex().size()).toBe(2)
    const content = await useContentService().getContent('tabId2')
    expect(content!.content).toBe('some html')
    expect(content!.metas['description' as keyof object]).toBe('Description')
  })

  it("adding tab with content to tabset's subfolder", async () => {
    const theTab = new Tab('tabId3', testDeChromeTab)

    const rootTabset = (await new CreateTabsetCommand('new Tabset2', []).execute()).result.tabset
    const subfolder: Tabset = (await new CreateFolderCommand(uid(), 'subfolder', [], rootTabset.id).execute()).result
    rootTabset.folderActive = subfolder.id

    const result = await new AddTabToTabsetCommand(theTab, rootTabset, subfolder.id).execute()
    expect(result.message).toBe('Link was added')

    const tabsetFromDB = useTabsetsStore().getTabset(rootTabset.id)!
    // console.log("tabsetFromDB", tabsetFromDB)
    expect(tabsetFromDB.tabs.length).toBe(0)
    expect(tabsetFromDB.name).toBe('new Tabset2')
    expect(tabsetFromDB.folders.length).toBe(1)
    expect(tabsetFromDB.folders[0]!.name).toBe('subfolder')

    expect(useSearchStore().getIndex().size()).toBe(1)
  })
})
