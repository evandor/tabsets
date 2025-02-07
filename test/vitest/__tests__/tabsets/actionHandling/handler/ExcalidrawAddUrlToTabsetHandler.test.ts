import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import IndexedDbContentPersistence from 'src/content/persistence/IndexedDbContentPersistence'
import { useContentService } from 'src/content/services/ContentService'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useSearchStore } from 'src/search/stores/searchStore'
import { useDB } from 'src/services/usePersistenceService'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
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
    expect(handler.urlMatcher().test(url)).toBeTruthy
    expect(handler.urlMatcher().test('https://skysail.io')).toBeFalsy
    expect(handler.urlMatcher().test('http://some.url.with/ending.rss')).toBeFalsy
  })

  it('matches any content', () => {
    expect(handler.contentMatcher(content)).toBeTruthy
  })

  it('has specific actions', async () => {
    await useCommandExecutor().execute(new CreateTabsetCommand('tabsetName'))
    const identifier = handler.actions('17').map((ac: ActionContext) => ac.identifier.toString())
    expect(identifier).toContain('SaveAs')
  })

  it('clicking saveAs Button results ...', async () => {
    const ts = new Tabset('tsId', 'tsName')
    await handler.clicked(BrowserApi.createChromeTabObject('title', url), ts, undefined, {
      data: { filename: 'excalitest' },
    })
    expect(ts.tabs.length).toBe(1)
    expect(ts.tabs[0]!.storage?.excalidraw).toBe('{"a":"A"}')
  })
})
