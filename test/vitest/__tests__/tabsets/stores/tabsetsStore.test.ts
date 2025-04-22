import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { uid } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useSearchStore } from 'src/search/stores/searchStore'
import { useDB } from 'src/services/usePersistenceService'
import SpacesPersistence from 'src/spaces/persistence/SpacesPersistence'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import IndexedDbSuggestionsPersistence from 'src/suggestions/persistence/IndexedDbSuggestionsPersistence'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { CreateFolderCommand } from 'src/tabsets/commands/CreateFolderCommand'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { LocalStorageTabsetsPersistence } from 'src/tabsets/persistence/LocalStorageTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

const storage = new LocalStorageTabsetsPersistence()

describe('tabsetsUiStore', () => {
  let startTime = 0
  let db = null as unknown as TabsetsPersistence
  let spacesDb = null as unknown as SpacesPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    await useTabsetsUiStore().initialize(storage)
    db = useDB(undefined).tabsetsDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    spacesDb = useDB(undefined).spacesDb
    await useSpacesStore().initialize(spacesDb)
    startTime = useTabsetsUiStore().lastUpdate

    await useSearchStore().init()
    await useSuggestionsStore().init(IndexedDbSuggestionsPersistence)
    //useSettingsStore().initialize()

    const chromeMock = {
      windows: {
        getCurrent: async () => window,
      },
      runtime: {
        sendMessage: vi.fn(() => {}),
      },
    }
    vi.stubGlobal('chrome', chromeMock)
  })

  afterEach(async () => {
    db.clear('tabsets')
    spacesDb.clear('spaces')
    storage.clear(undefined)
  })

  it('tabsForUrls with one tabset', () => {
    let found = useTabsetsStore().tabsForUrl('https://www.skysail.io/')
    expect(found.length).toBe(0)

    const tabs = [BrowserApi.createChromeTabObject('skysail', 'https://www.skysail.io/', 'favicon')]
    useCommandExecutor().execute(new CreateTabsetCommand('tabsetName', tabs))
    found = useTabsetsStore().tabsForUrl('https://www.skysail.io/')
    expect(found.length).toBe(1)

    useCommandExecutor().execute(
      new CreateTabsetCommand('tabsetName', [
        BrowserApi.createChromeTabObject('heise', 'https://www.heise.de/', 'favicon'),
      ]),
    )
    found = useTabsetsStore().tabsForUrl('https://www.skysail.io/')
    expect(found.length).toBe(1)
  })

  it('tabsForUrls with multiple tabsets', async () => {
    const ts1Tabs = [
      BrowserApi.createChromeTabObject('skysail', 'https://www.skysail.io/', 'favicon'),
      BrowserApi.createChromeTabObject('heise', 'https://www.heise.de/', 'favicon'),
    ]
    const res1 = await useCommandExecutor().execute(new CreateTabsetCommand('ts1', ts1Tabs))

    const ts2Tabs = [BrowserApi.createChromeTabObject('skysail', 'https://www.skysail.io/', 'favicon')]
    const res2 = await useCommandExecutor().execute(new CreateTabsetCommand('ts2', ts2Tabs))

    let found = useTabsetsStore().tabsForUrl('https://www.heise.de/')
    expect(found.length).toBe(1)

    found = useTabsetsStore().tabsForUrl('https://www.skysail.io/')
    expect(found.length).toBe(2)
    expect(found[0]!.tabsetId).toBe(res1.result.tabset.id)
    expect(found[1]!.tabsetId).toBe(res2.result.tabset.id)
  })

  it('tabsForUrlInCurrentTabset with tabsets with folder', async () => {
    const rootTabs = [
      BrowserApi.createChromeTabObject('skysailroot', 'https://www.skysail.io/', 'favicon'),
      BrowserApi.createChromeTabObject('heise', 'https://www.heise.de/', 'favicon'),
    ]
    const res1 = await useCommandExecutor().execute(new CreateTabsetCommand('ts1', rootTabs))

    const folderTabs: Tab[] = [
      new Tab(uid(), BrowserApi.createChromeTabObject('skysailfolder', 'https://www.skysail.io/', 'favicon')),
    ]
    await useCommandExecutor().execute(new CreateFolderCommand(uid(), 'folder', folderTabs, res1.result.tabset.id))

    // let found = useTabsetsStore().tabsForUrlInCurrentTabset('https://www.heise.de/')
    // expect(found.length).toBe(1)

    let found = useTabsetsStore().tabsForUrlInCurrentTabset('https://www.skysail.io/')
    expect(found.length).toBe(2)
    //expect(found[0]!.tabsetId).toBe(res1.result.tabset.id)
  })
})
