import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {mount} from '@vue/test-utils';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import {useTabsStore} from "stores/tabsStore";
import ChromeApi from "src/services/ChromeApi";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import SidePanelPage from "pages/SidePanelPage.vue";
import {usePermissionsStore} from "stores/permissionsStore";
import {useDB} from "src/services/usePersistenceService";
import PersistenceService from "src/services/PersistenceService";
import {useQuasar} from "quasar";

installQuasarPlugin();

describe('SidePanelPage', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")

  let db = null as unknown as PersistenceService

  beforeAll(() => {
    // https://vitest.dev/guide/browser.html
    // @ts-ignore - needed as 'chrome' is undefined in vitest
    global.chrome = undefined
    // global.browser = browser
    db = useDB(useQuasar()).localDb
  })

  beforeEach(async () => {
    setActivePinia(createPinia())
  })

  it('should be mounted', async () => {
    await IndexedDbPersistenceService.init("db")
    //await usePermissionsStore().initialize(db)
    useTabsStore().setCurrentChromeTab(skysailChromeTab)
    const wrapper = mount(SidePanelPage);
    console.log("hier", wrapper.html())
    expect(wrapper.text()).toContain("My Tabsets");
    expect(wrapper.text()).not.toContain("search");
  });


  // it('should be mounted2', async () => {
  //   await IndexedDbPersistenceService.init("db")
  //   await usePermissionsStore().initialize()
  //   useTabsStore().setCurrentChromeTab(skysailChromeTab)
  //   const wrapper = mount(SidePanelPage);
  //
  //   await new CreateTabsetCommand("new Tabset A", [skysailChromeTab]).execute()
  //
  //   console.log("hier", wrapper.html())
  //   expect(wrapper.text()).toContain("new Tabset A");
  //   expect(wrapper.text()).toContain("1 tab");
  // });


});
