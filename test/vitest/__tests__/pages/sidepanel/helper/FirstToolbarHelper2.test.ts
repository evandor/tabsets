import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import ChromeApi from 'src/app/BrowserApi'
import IndexedDbPersistenceService from 'src/services/IndexedDbPersistenceService'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import FirstToolbarHelper2 from 'src/pages/sidepanel/helper/FirstToolbarHelper2.vue'

installQuasarPlugin()

describe('FirstToolbarHelper2', () => {
  vi.mock('vue-i18n', () => ({
    useI18n: () => ({
      t: (key: string) => (key === 'welcome_to_tabsets' ? 'Welcome to Tabsets' : key),
    }),
  }))

  const skysailChromeTab = ChromeApi.createChromeTabObject(
    'title',
    'https://www.skysail.io',
    'favicon',
  )

  beforeEach(async () => {
    setActivePinia(createPinia())

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
      },
    }

    vi.stubGlobal('chrome', chromeMock)
  })

  it('should be mounted', async () => {
    await IndexedDbPersistenceService.init('db')
    await IndexedDbTabsetsPersistence.init()
    useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    const wrapper = mount(FirstToolbarHelper2)
    console.log('hier', wrapper.html())
    //expect(wrapper.text()).toContain("My Tabsets");
    expect(wrapper.text()).not.toContain('search')
  })
})