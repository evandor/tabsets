import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChromeApi from 'src/app/BrowserApi'
import FirstToolbarHelper2 from 'src/core/pages/sidepanel/helper/FirstToolbarHelper2.vue'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

describe('FirstToolbarHelper2', () => {
  vi.mock('vue-i18n', () => ({
    useI18n: () => ({
      t: (key: string) => (key === 'welcome_to_tabsets' ? 'Welcome to Tabsets' : key),
    }),
  }))

  const skysailChromeTab = ChromeApi.createChromeTabObject('title', 'https://www.skysail.io', 'favicon')

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
    await IndexedDbTabsetsPersistence.init(null as unknown as IFirebaseServices)
    useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    const wrapper = mount(FirstToolbarHelper2)
    console.log('hier', wrapper.html())
    //expect(wrapper.text()).toContain("My Tabsets");
    expect(wrapper.text()).not.toContain('search')
  })
})
