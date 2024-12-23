import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { mount, config } from '@vue/test-utils'
import { beforeEach, describe, expect, vi, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import ChromeApi from 'src/app/BrowserApi'
import IndexedDbPersistenceService from 'src/services/IndexedDbPersistenceService'
import { useRoute, useRouter } from 'vue-router'
import WelcomePage from 'src/pages/sidepanel/WelcomePage.vue'

installQuasarPlugin()

vi.mock('vue-router')
vi.mock('vue-i18n')

describe('WelcomePage', () => {
  const skysailChromeTab = ChromeApi.createChromeTabObject(
    'title',
    'https://www.skysail.io',
    'favicon',
  )

  // @ts-expect-error TODO
  useRouter.mockReturnValue({
    push: vi.fn(),
  })

  // @ts-expect-error TODO
  useRoute.mockReturnValue({
    query: {
      name,
    },
  })

  vi.mock('vue-i18n', () => ({
    useI18n: () => ({
      t: (key: string) => (key === 'welcome_to_tabsets' ? 'Welcome to Tabsets' : key),
    }),
  }))

  beforeEach(async () => {
    setActivePinia(createPinia())
    // @ts-expect-error TODO
    useRouter().push.mockReset()
  })

  it('should be mounted', async () => {
    await IndexedDbPersistenceService.init('db')
    const wrapper = mount(WelcomePage)
    console.log('wrapper', wrapper.html())
    expect(wrapper.text()).toContain('welcome_to_tabsets')
  })
})
