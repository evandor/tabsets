import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import BrowserApi from 'src/app/BrowserApi'
import IndexedDbContentPersistence from 'src/content/persistence/IndexedDbContentPersistence'
import { useContentService } from 'src/content/services/ContentService'
import { useSearchStore } from 'src/search/stores/searchStore'
import { useDB } from 'src/services/usePersistenceService'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

vi.mock('vue-router')

describe('DefaultAddUrlToTabsetHandler', () => {
  setActivePinia(createPinia())
  const url = 'http://a.default.url'
  const content = '<html>default page</html>'
  const handler = useActionHandlers(undefined).getHandler(url)

  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    db = useDB(undefined).tabsetsDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    await useSearchStore().init()
    await useContentService().init(IndexedDbContentPersistence)
  })

  it('matches only non-special url', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(handler.urlMatcher().test(url)).toBeTruthy
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(handler.urlMatcher().test('https://excalidraw.com/')).toBeFalsy
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(handler.urlMatcher().test('http://some.url.with/ending.rss')).toBeFalsy
  })

  it('matches any content', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(handler.contentMatcher(content)).toBeTruthy
  })

  it('has specific actions', () => {
    const identifier = handler.actions('17').map((ac: ActionContext) => ac.identifier.toString())
    expect(identifier).toContain('AddTab')
    expect(identifier).toContainEqual('AddTab')
  })

  it('clicking addTab Button results in tab being added', async () => {
    const ts = new Tabset('tsId', 'tsName')
    await handler.clicked(BrowserApi.createChromeTabObject('title', url), ts)
    expect(ts.tabs.length).toBe(1)
  })
})
