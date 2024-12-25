import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChromeApi from 'src/app/BrowserApi'
import SidePanelPage2 from 'src/pages/SidePanelPage2.vue'
import { useDB } from 'src/services/usePersistenceService'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

describe('SidePanelPage2', () => {
  vi.mock('vue-i18n', () => ({
    useI18n: () => ({
      t: (key: string) => (key === 'welcome_to_tabsets' ? 'Welcome to Tabsets' : key),
    }),
  }))

  const skysailChromeTab = ChromeApi.createChromeTabObject(
    'title',
    'https://www.skysail.io/some-subpage',
    'favicon',
  )

  let db = null as unknown as TabsetsPersistence
  let wrapper: VueWrapper<any, any> = null as unknown as VueWrapper

  beforeAll(() => {
    // https://vitest.dev/guide/browser.html
    // @ts-expect-error TODO - needed as 'chrome' is undefined in vitest
    global.chrome = undefined
    // global.browser = browser
    //db = useDB(useQuasar()).localDb
  })

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbTabsetsPersistence.init()
    db = useDB(undefined).tabsetsIndexedDb
    await useTabsetsStore().initialize(db)
    // await usePermissionsStore().initialize(new LocalStoragePersistenceService(useQuasar()))
    await useTabsetService().init()

    const chromeMock = {
      commands: {
        onCommand: {
          addListener: vi.fn(() => {
            return []
          }),
        },
      },
      tabs: {
        query: vi.fn(() => {}),
      },
      runtime: {
        sendMessage: vi.fn(() => {}),
        onMessage: {
          addListener: vi.fn(() => {}),
        },
      },
    }

    vi.stubGlobal('chrome', chromeMock)

    wrapper = mount(SidePanelPage2)
  })

  it('should be mounted', async () => {
    useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    console.log('hier', wrapper.html())
    expect(wrapper.text()).toContain('how to start?')
    expect(wrapper.text()).not.toContain('search')
  })

  it('should show existing tabset', async () => {
    await new CreateTabsetCommand('existing Tabset', []).execute()
    useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    const wrapper = mount(SidePanelPage2)
    //console.log("hier", wrapper.html())
    //console.log("hier2", wrapper.text())
    expect(wrapper.html()).toContain('existing Tabset')
    //expect(wrapper.html()).not.toContain("search");
  })
})
