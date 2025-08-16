import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import BrowserApi from 'src/app/BrowserApi'
import { useDynamicConfig } from 'src/config/dynamicConfigStore'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useContentStore } from 'src/content/stores/contentStore'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useDB } from 'src/services/usePersistenceService'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { PageData } from 'src/tabsets/models/PageData'
import { LocalStorageTabsetsPersistence } from 'src/tabsets/persistence/LocalStorageTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { useTagsService } from 'src/tags/TagsService'
import { beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

const storage = new LocalStorageTabsetsPersistence()

describe('notify example', () => {
  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    setActivePinia(createPinia())
    await useTabsetsUiStore().initialize(storage)
    db = useDB(undefined).tabsetsDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
  })

  it('minimal tabReferences example', async () => {
    const tR = new TabReference('tr1', TabReferenceType.LINKING_DATA, 'trTitle', [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: 'https://www.test.de/',
      },
    ])
    const result = await useTagsService().analyse('theTitle', {}, undefined, [tR], 'https://www.test.de')
    expect(result).toEqual([
      { label: 'test', type: 'url', score: 1 },
      { label: 'de', type: 'url', score: 1 },
      { label: 'WebSite', type: 'linkingData', score: 1 },
    ])
  })

  it('minimal keywords example', async () => {
    const result = await useTagsService().analyse(
      'theTitle',
      { keywords: 'wordA, wordB' },
      undefined,
      [],
      'https://www.test.de',
    )
    expect(result).toEqual([
      { label: 'test', type: 'url', score: 1 },
      { label: 'de', type: 'url', score: 1 },
      { label: 'worda', type: 'keyword', score: 1 },
      { label: 'wordb', type: 'keyword', score: 1 },
    ])
  })

  it('minimal url example', async () => {
    const result = await useTagsService().analyse('theTitle', {}, undefined, [], 'https://www.test.de')
    expect(result).toEqual([
      { label: 'test', type: 'url', score: 1 },
      { label: 'de', type: 'url', score: 1 },
    ])
  })

  it('minimal hierarchy example', async () => {
    await useCommandExecutor().execute(new CreateTabsetCommand('tabset', []))
    const result = await useTagsService().analyse('theTitle', {}, undefined, [], 'https://www.test.de')
    expect(result).toEqual([
      { label: 'test', type: 'url', score: 1 },
      { label: 'de', type: 'url', score: 1 },
      { label: 'tabset', type: 'hierarchy', score: 1 },
    ])
  })

  it('minimal description example', async () => {
    const result = await useTagsService().analyse(
      'theTitle',
      { description: 'Stiftung Warentest: Testberichte zu Elektronik, Haushalt und Gesundheit sowie Finanzen' },
      undefined,
      [],
      'https://www.test.de',
    )
    expect(result).toEqual([
      { label: 'test', type: 'url', score: 1 },
      { label: 'de', type: 'url', score: 1 },
      { label: 'stiftung', type: 'languageModel', score: 5.78 },
      { label: 'warentest', type: 'languageModel', score: 5.78 },
      { label: 'testberichte', type: 'languageModel', score: 5.78 },
      { label: 'elektronik', type: 'languageModel', score: 5.78 },
      { label: 'haushalt', type: 'languageModel', score: 5.78 },
      { label: 'gesundheit', type: 'languageModel', score: 5.78 },
      { label: 'finanzen', type: 'languageModel', score: 5.78 },
    ])
  })

  it('getCurrentTabContentClassification', async () => {
    const chromeMock = {
      tabs: {
        sendMessage: vi.fn(async (a: any, b: any, c: any) => {
          console.log('sendMessage', a, b, c)
          const payload = {
            html: '<html>test</html>',
            metas: { 'og:type': 'Article' },
            url: 'https://www.test.de',
          } as PageData
          return Promise.resolve(payload)
        }),
      },
    }
    vi.stubGlobal('chrome', chromeMock)
    useDynamicConfig().init()
    const browserTab = BrowserApi.createChromeTabObject('tabset', 'https://www.test.de', 'favicon')
    await useContentStore().resetFor(browserTab)
    const res = useTagsService().getCurrentTabContentClassification()
    expect(res).toEqual({ classification: 'system:news', matchedFrom: 'openGraph/Article' })
  })
})
