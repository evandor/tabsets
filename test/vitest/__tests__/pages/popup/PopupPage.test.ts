import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { LocalStorage } from 'quasar'
import ChromeApi from 'src/app/BrowserApi'
import PopupPage from 'src/core/pages/popup/PopupPage.vue'
import { useDB } from 'src/services/usePersistenceService'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

vi.mock('vue-router')

describe('PopupPage', () => {
  vi.mock('vue-i18n', () => ({
    useI18n: () => ({
      t: (key: string) => (key === 'welcome_to_tabsets' ? 'Welcome to Tabsets' : key),
    }),
  }))

  const skysailChromeTab = ChromeApi.createChromeTabObject('title', 'https://www.skysail.io/some-subpage', 'favicon')

  let db = null as unknown as TabsetsPersistence
  let wrapper: VueWrapper<any, any> = null as unknown as VueWrapper

  function getHtmlInputValue(testId: string) {
    return (wrapper.find(`[data-testid=${testId}]`).element as HTMLInputElement).value
  }

  beforeAll(() => {
    // https://vitest.dev/guide/browser.html
    // @ts-expect-error TODO - needed as 'chrome' is undefined in vitest
    global.chrome = undefined
    // global.browser = browser
    //db = useDB(useQuasar()).localDb
  })

  beforeEach(async () => {
    setActivePinia(createPinia())

    LocalStorage.setItem('ui.hideWelcomePage', true)

    await IndexedDbTabsetsPersistence.init()
    db = useDB(undefined).tabsetsDb
    await useTabsetsStore().initialize(db)
    // await usePermissionsStore().initialize(new LocalStoragePersistenceService(useQuasar()))
    await useTabsetService().init()

    const chromeMock = {
      windows: {
        getCurrent: async () => window,
      },
      commands: {
        onCommand: {
          addListener: vi.fn(() => {
            return []
          }),
        },
        getAll: vi.fn(() => {
          return Promise.resolve([])
        }),
      },
      tabs: {
        query: vi.fn(() => {}),
      },
      runtime: {
        sendMessage: vi.fn(() => {}),
        onMessage: {
          addListener: vi.fn(() => {}),
        },
        getContexts: vi.fn(() => {}),
      },
    }

    vi.stubGlobal('chrome', chromeMock)
  })

  it('should be mounted', async () => {
    useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    wrapper = mount(PopupPage)
    console.log('hier', wrapper.html())
    expect(wrapper.text()).toContain('Collection')
    expect(wrapper.text()).not.toContain('search')
  })

  // it('shows the browsers current tab if not yet saved', async () => {
  //   useTabsStore2().setCurrentChromeTab(skysailChromeTab)
  //   const tabsetsMap = new Map<string, Tabset>()
  //   tabsetsMap.set('id', new Tabset('id', 'dummy', []))
  //   tabsetsMap.set('id2', new Tabset('id2', 'dummy2', []))
  //   useTabsetsStore().tabsets = tabsetsMap
  //   await useTabsetsStore().selectCurrentTabset('id')
  //   wrapper = mount(PopupPage)
  //   //console.log('hier', wrapper.html())
  //   expect(getHtmlInputValue('pageModelTitle')).toBe('title')
  //   expect(getHtmlInputValue('pageModelDescription')).toBe('')
  //   expect(getHtmlInputValue('pageModelUrl')).toBe('https://www.skysail.io/some-subpage')
  // })

  // it('should show existing tabset', async () => {
  //   await new CreateTabsetCommand('existing Tabset', []).execute()
  //   useTabsStore2().setCurrentChromeTab(skysailChromeTab)
  //   const wrapper = mount(SidePanelPage2)
  //   console.log('hier', wrapper.html())
  //   //console.log("hier2", wrapper.text())
  //   expect(wrapper.html()).toContain('existing Tabset')
  //   //expect(wrapper.html()).not.toContain("search");
  // })
})
