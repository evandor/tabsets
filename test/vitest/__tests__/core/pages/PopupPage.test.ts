import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { LocalStorage } from 'quasar'
import ChromeApi from 'src/app/BrowserApi'
import { useContentStore } from 'src/content/stores/contentStore'
import PopupPage from 'src/core/pages/popup/PopupPage.vue'
import { useDB } from 'src/services/usePersistenceService'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

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

  afterEach(async () => {
    db.clear('tabsets')
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('should be mounted from browser tab', async () => {
    useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    useContentStore().setCurrentTabMetas({
      keywords: 'keyword1, keyword2',
      description: 'The Websites Description',
    })
    await new CreateTabsetCommand('new Tabset', []).execute()
    //const tabset = createTabsetResult.result.tabset

    wrapper = mount(PopupPage)

    //console.log('hier', wrapper.html())
    expect(wrapper.vm.url).toBe('https://www.skysail.io/some-subpage')
    expect(wrapper.vm.title).toBe('title')
    expect(wrapper.vm.description).toBe('The Websites Description')
    expect(wrapper.vm.note).toBe('')
    // console.log('***', wrapper.vm.tagsInfo)
    expect(wrapper.vm.tagsInfo).toEqual([
      { label: 'newtabset', type: 'hierarchy', score: 1 },
      { label: 'websites', type: 'languageModel', score: 5.78 },
      { label: 'description', type: 'languageModel', score: 4.65 },
      { label: 'keyword1', type: 'keyword', score: 1 },
      { label: 'keyword2', type: 'keyword', score: 1 },
    ])
  })

  it('should be saved as a new tab', async () => {
    useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    useContentStore().setCurrentTabMetas({
      keywords: 'keyword1, keyword2',
      description: 'The Websites Description',
    })
    const executionResult = await new CreateTabsetCommand('new Tabset', []).execute()
    //const ts = executionResult.result.tabset

    wrapper = mount(PopupPage)

    await wrapper.find('[data-testid=pageModelNote]').setValue('a note')
    await wrapper.find('[data-testid=addNewTabBtn]').trigger('click')

    const ts = useTabsetsStore().getCurrentTabset
    expect(ts!.tabs.length).toBe(1)
    expect(ts!.tabs[0]!.title).toBe('title')
    expect(ts!.tabs[0]!.note).toBe('a note')
    // TODO
    // expect(ts!.tabs[0]!.tagsInfo.length).toBe(9)
  })

  it('should be loaded from existing tab', async () => {
    useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    useContentStore().setCurrentTabMetas({
      keywords: 'keyword1, keyword2',
      description: 'The Websites Description',
    })
    const executionResult = await new CreateTabsetCommand('new Tabset', []).execute()
    //const ts = executionResult.result.tabset

    wrapper = mount(PopupPage)

    await wrapper.find('[data-testid=pageModelNote]').setValue('a note')
    await wrapper.find('[data-testid=addNewTabBtn]').trigger('click')

    // useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    // const creationResult = await new CreateTabsetCommand('new Tabset', []).execute()
    // const tabset = creationResult.result.tabset
    // await new AddTabToTabsetCommand(new Tab(uid(), skysailChromeTab), tabset).execute()

    wrapper = mount(PopupPage)

    expect(wrapper.vm.url).toBe('https://www.skysail.io/some-subpage')
    expect(wrapper.vm.title).toBe('title')
    expect(wrapper.vm.description).toBe('The Websites Description')
    expect(wrapper.vm.note).toBe('a note')
    // expect(wrapper.vm.tagsInfo).toEqual([])
  })

  // it('should be mounted from browser tab with AI activated', async () => {
  //   useTabsStore2().setCurrentChromeTab(skysailChromeTab)
  //   useContentStore().setCurrentTabMetas({ keywords: 'keyword1, keyword2', description: 'The Websites Description' })
  //   await useFeaturesStore().initialize(InMemoryFeaturesPersistence)
  //   await new ActivateFeatureCommand('AI').execute()
  //   await new CreateTabsetCommand('new Tabset', []).execute()
  //
  //   wrapper = mount(PopupPage)
  //
  //   //console.log('hier', wrapper.html())
  // })
})
