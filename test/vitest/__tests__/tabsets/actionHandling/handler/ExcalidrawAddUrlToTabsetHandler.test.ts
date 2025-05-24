import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useQuasar } from 'quasar'
import IndexedDbContentPersistence from 'src/content/persistence/IndexedDbContentPersistence'
import { useContentService } from 'src/content/services/ContentService'
import { useSearchStore } from 'src/search/stores/searchStore'
import { useDB } from 'src/services/usePersistenceService'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

vi.mock('vue-router')

describe('ExcalidrawAddUrlToTabsetHandler', () => {
  setActivePinia(createPinia())
  const url = 'https://excalidraw.com/'
  const content = '<html>default page</html>'
  const handler = useActionHandlers(useQuasar()).getHandler(url)

  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    db = useDB(undefined).tabsetsDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    await useSearchStore().init()
    await useContentService().init(IndexedDbContentPersistence)

    const chromeMock = {
      windows: {
        getCurrent: async () => window,
      },
      scripting: {
        executeScript: vi.fn(() => {
          return [
            {
              result: {
                excalidraw: '{"a": "A"}',
              },
            },
          ]
        }),
      },
    }

    vi.stubGlobal('chrome', chromeMock)
  })

  it('matches excalidraw url', () => {
    expect(handler.tabMatcher(url, content, {})).toBe(true)
    expect(handler.tabMatcher('https://skysail.io', content, {})).toBe(false)
    expect(handler.tabMatcher('http://some.url.with/ending.rss', content, {})).toBe(false)
  })

  it('matches any content', () => {
    expect(handler.tabMatcher('url', content, {})).toBe(false)
  })

  it('clicking saveAs Button results ...', async () => {
    const ts = new Tabset('tsId', 'tsName')
    // await handler.clicked(BrowserApi.createChromeTabObject('title', url), ts, undefined, {
    //   data: { filename: 'excalitest' },
    // })
    expect(ts.tabs.length).toBe(1)
    expect(ts.tabs[0]!.storage?.excalidraw).toBe('{"a":"A"}')
  })
})
