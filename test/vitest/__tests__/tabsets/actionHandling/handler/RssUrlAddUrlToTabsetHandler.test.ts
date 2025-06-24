import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { QVueGlobals } from 'quasar'
import IndexedDbContentPersistence from 'src/content/persistence/IndexedDbContentPersistence'
import { useContentService } from 'src/content/services/ContentService'
import { useSearchStore } from 'src/search/stores/searchStore'
import { useDB } from 'src/services/usePersistenceService'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

vi.mock('vue-router')

describe('RssAddUrlToTabsetHandler', () => {
  setActivePinia(createPinia())
  const url = 'http://some.url.with/ending.rss'
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
    expect(handler.tabMatcher('https://excalidraw.com/', '', {})).toBe(false)
    expect(handler.tabMatcher('', '', {})).toBe(false)
    expect(handler.tabMatcher('https://skysail.io/', '', {})).toBe(false)
  })

  it('does not match content', () => {
    expect(handler.tabMatcher('', '', {})).toBe(false)
  })

  // it('has specific actions', () => {
  //   const identifier = handler.actions('17').map((ac: ActionContext) => ac.identifier.toString())
  //   expect(identifier).toEqual(['AddRssFeed'])
  // })

  // it('clicking addTab Button results in tab being added', async () => {
  //   const ts = new Tabset('tsId', 'tsName')
  //   // await handler.clicked(BrowserApi.createChromeTabObject('title', url), ts, undefined, {
  //   //   dialog: {
  //   //     more: {},
  //   //   },
  //   // })
  //   expect(ts.tabs.length).toBe(1)
  // })
})
