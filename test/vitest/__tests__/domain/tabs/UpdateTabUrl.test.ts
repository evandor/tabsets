import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import ChromeApi from 'src/app/BrowserApi'
import IndexedDbContentPersistence from 'src/content/persistence/IndexedDbContentPersistence'
import { useContentService } from 'src/content/services/ContentService'
import { useSearchStore } from 'src/search/stores/searchStore'
import { useDB } from 'src/services/usePersistenceService'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { UpdateTabCommand } from 'src/tabsets/commands/UpdateTabCommand'
import { Tab } from 'src/tabsets/models/Tab'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

vi.mock('vue-router')

describe('UpdateTabUrl', () => {
  const skysailChromeTab = ChromeApi.createChromeTabObject('title', 'https://www.skysail.io', 'favicon')

  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbTabsetsPersistence.init()
    await IndexedDbContentPersistence.init()
    await useContentService().init(IndexedDbContentPersistence)
    db = useDB().tabsetsDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    await useSearchStore().init()
  })

  afterEach(async () => {
    db.clear('tabsets')
  })

  it('updating url changes url', async () => {
    const createTabsetResult = await new CreateTabsetCommand('new Tabset', []).execute()
    const tabset = createTabsetResult.result.tabset
    const tab = new Tab('tabId', skysailChromeTab)
    await new AddTabToTabsetCommand(tab, tabset).execute()

    const result = await new UpdateTabCommand(tab, 'https://skysail.io', 'newName', '').execute()
    expect(result.message).toBe('Tab updated')
    expect(result.result).toBe('https://skysail.io')

    // await useTabsetService().saveTabset(tabset)
    const tabsetFromDB = useTabsetsStore().getTabset(tabset.id)
    expect(tabsetFromDB?.tabs[0]!.url).toBe('https://skysail.io')
  })

  it('updating url and reverting does not change url', async () => {
    const createTabsetResult = await new CreateTabsetCommand('new Tabset', []).execute()
    const tabset = createTabsetResult.result.tabset
    const tab = new Tab('tabId', skysailChromeTab)
    await new AddTabToTabsetCommand(tab, tabset).execute()

    const result = await new UpdateTabCommand(tab, 'https://skysail.io', 'newName', '').execute()
    await result.nextCommands.values().next().value?.execute()

    const tabsetFromDB = useTabsetsStore().getTabset(createTabsetResult.result.tabset.id)
    expect(tabsetFromDB?.tabs[0]!.url).toBe('https://www.skysail.io')
  })
})
