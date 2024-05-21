import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {mount, VueWrapper} from '@vue/test-utils';
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import ChromeApi from "src/services/ChromeApi";
import SidePanelPage from "pages/SidePanelPage.vue";
import {useDB} from "src/services/usePersistenceService";
import {useQuasar} from "quasar";
import {CreateTabsetCommand} from "src/tabsets/commands/CreateTabset";
import {useTabsetService} from "src/services/TabsetService2";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import IndexedDbTabsetsPersistence from "src/tabsets/persistence/IndexedDbTabsetsPersistence";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

installQuasarPlugin();

describe('SidePanelPage', () => {


  vi.mock("vue-i18n", () => ({
    useI18n: () => ({t: (key: string) => key === 'welcome_to_tabsets' ? "Welcome to Tabsets" : key}),
  }));

  const skysailChromeTab = ChromeApi.createChromeTabObject(
    "title", "https://www.skysail.io/some-subpage", "favicon")

  let db = null as unknown as TabsetsPersistence;
  let wrapper: VueWrapper<any, any> = null as unknown as VueWrapper

  beforeAll(() => {
    // https://vitest.dev/guide/browser.html
    // @ts-ignore - needed as 'chrome' is undefined in vitest
    global.chrome = undefined
    // global.browser = browser
    db = useDB(useQuasar()).localDb
  })

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbTabsetsPersistence.init()
    db = useDB(undefined).tabsetsIndexedDb
    await useTabsetsStore().initialize(db)
    // await usePermissionsStore().initialize(new LocalStoragePersistenceService(useQuasar()))
    await useTabsetService().init(db)

    const chromeMock = {
      commands: {
        onCommand: {
          addListener: vi.fn(() => {
            return [];
          }),
        }
      },
      tabs: {
        query: vi.fn(() => {
        })
      },
      runtime: {
        sendMessage: vi.fn(() => {
        }),
        onMessage: {
          addListener: vi.fn(() => {
          })
        }
      }
    };

    vi.stubGlobal('chrome', chromeMock);

    wrapper = mount(SidePanelPage);

  })

  it('should be mounted', async () => {
    useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    console.log("hier", wrapper.html())
    expect(wrapper.text()).toContain("My Tabsets");
    expect(wrapper.text()).not.toContain("search");
  });

  it('should show existing tabset', async () => {
    await new CreateTabsetCommand("existing Tabset", []).execute()
    useTabsStore2().setCurrentChromeTab(skysailChromeTab)
    const wrapper = mount(SidePanelPage);
    //console.log("hier", wrapper.html())
    //console.log("hier2", wrapper.text())
    expect(wrapper.html()).toContain("existing Tabset");
    //expect(wrapper.html()).not.toContain("search");
  });


});
