import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { QVueGlobals } from 'quasar'
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

describe('DefaultAddUrlToTabsetHandler', () => {
  setActivePinia(createPinia())
  const url = 'http://a.default.url'
  const content = '<html>default page</html>'
  const handler = useActionHandlers(null as unknown as QVueGlobals).getHandler(url)

  let db = null as unknown as TabsetsPersistence

  beforeEach(async () => {
    db = useDB(undefined).tabsetsDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    await useSearchStore().init()
    await useContentService().init(IndexedDbContentPersistence)
  })

  it('matches only non-special url', () => {
    expect(handler.tabMatcher(url, '', {})).toBe(true)
    expect(handler.tabMatcher('http://excalidraw.com', '', {})).toBe(true)
    expect(handler.tabMatcher('http://some.url.with/ending.rss', '', {})).toBe(true)
  })

  it('matches any content', () => {
    expect(handler.tabMatcher('', content, {})).toBe(true)
  })

  it('actions', async () => {
    const ts = new Tabset('tsId', 'tsName')
    const actions = handler.actions(undefined, { tabset: ts, level: 'root', element: 'contextmenu' })
    expect(actions.length).toBe(1)
  })
})
