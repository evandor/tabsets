import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { DOMWrapper, mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Dialog, Notify } from 'quasar'
import IFirebaseServices from 'src/services/firebase/IFirebaseServices'
import { useDB } from 'src/services/usePersistenceService'
import NewTabsetDialogBody from 'src/tabsets/dialogues/helper/NewTabsetDialogBody.vue'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouter } from 'vue-router'

installQuasarPlugin({ plugins: { Dialog, Notify } })

vi.mock('vue-router')

describe('NewTabsetDialogBody', () => {
  let db = null as unknown as TabsetsPersistence
  let wrapper: VueWrapper<any, any> = null as unknown as VueWrapper
  let input: DOMWrapper<Element> = null as unknown as DOMWrapper<Element>
  let submitButton: DOMWrapper<Element> = null as unknown as DOMWrapper<Element>

  // @ts-expect-error TODO
  useRouter.mockReturnValue({ push: vi.fn() })

  beforeEach(async () => {
    setActivePinia(createPinia())
    // @ts-expect-error TODO
    useRouter().push.mockReset()
    await IndexedDbTabsetsPersistence.init(null as unknown as IFirebaseServices)
    db = useDB(undefined).tabsetsDb
    await useTabsetsStore().initialize(db)
    await useTabsetService().init()
    wrapper = mount(NewTabsetDialogBody, { props: {} })

    input = wrapper.find('[data-testid=newTabsetName]')
    submitButton = wrapper.find('[data-testid=newTabsetNameSubmit]')

    const chromeMock = {
      windows: {
        getCurrent: async () => window,
      },
      runtime: {
        sendMessage: vi.fn(() => {}),
      },
    }
    vi.stubGlobal('chrome', chromeMock)
  })

  afterEach(async () => {
    db.clear('tabsets')
  })

  it('should be mounted', async () => {
    expect(wrapper.text()).toContain('Add Tabset')
    expect(wrapper.text()).toContain('Add all open tabs')
  })

  it('adds Tabset with a new Name', async () => {
    // const wrapper = mount(NewTabsetDialogBody, {props: {},attachTo: '#root'});
    expect(submitButton.classes('disabled')).toBe(true)
    await input.setValue('Tabset A')
    await wrapper.find('form').trigger('submit.prevent')
    await checkTabsetNamesInDb(db, ['Tabset A'])
  })

  // TODO reactivate
  // it('rejects existing Tabset', async () => {
  //   await new CreateTabsetCommand("existing Tabset", []).execute()
  //   await input.setValue("existing Tabset")
  //   await wrapper.find("form").trigger("submit.prevent")
  //   await checkTabsetNamesInDb(db, ['existing Tabset'])
  // });

  // seems unreliable
  it.skip('rejects Tabset with an un-allowed character', async () => {
    await input.setValue('Tabset with :')
    await wrapper.find('form').trigger('submit.prevent')
    await checkTabsetNamesInDb(db, [])
  })

  it('rejects Tabset with an overlong name', async () => {
    await input.setValue('012345678901234567890123456789123')
    await wrapper.find('form').trigger('submit.prevent')
    await checkTabsetNamesInDb(db, [])
  })

  it('accepts Tabset with space ID', async () => {
    wrapper = mount(NewTabsetDialogBody, { props: { spaceId: '17' } })
    input = wrapper.find('[data-testid=newTabsetName]')
    submitButton = wrapper.find('[data-testid=newTabsetNameSubmit]')

    await input.setValue('Tabset with Space ID')
    await wrapper.find('form').trigger('submit.prevent')
    await db.loadTabsets()
    const tabsets = useTabsetsStore().tabsets
    expect(tabsets.size).toBe(1)
    // TODO
    // expect(tabsets.values().next().value.spaceId).toBe("17")
  })
})

async function checkTabsetNamesInDb(db: TabsetsPersistence, tabsetNames: string[]) {
  await db.loadTabsets()
  const tabsets = useTabsetsStore().tabsets
  expect(tabsets.size).toBe(tabsetNames.length)
  let index = 0
  for (let [key, value] of tabsets) {
    expect(value.name).toBe(tabsetNames[index++])
  }
}
