import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {mount} from '@vue/test-utils';
import {beforeAll, beforeEach, describe, expect, vi, it} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import {useTabsStore} from "stores/tabsStore";
import ChromeApi from "src/services/ChromeApi";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import SidePanelTabInfo from "pages/sidepanel/SidePanelTabInfo.vue";
import {useRoute, useRouter} from "vue-router";
import WelcomePage from "pages/sidepanel/WelcomePage.vue";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import {Tab} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";

installQuasarPlugin();

vi.mock('vue-router')

describe('AddTabToTabsetCommand', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")

  // @ts-ignore
  useRouter.mockReturnValue({
    push: vi.fn(),
  })

  // @ts-ignore
  useRoute.mockReturnValue({
    query: {
      name,
    },
  })

  beforeEach(async () => {
    setActivePinia(createPinia())
    // @ts-ignore
    useRouter().push.mockReset()
  })

  it('adding', async () => {
    await IndexedDbPersistenceService.init("db")
    const cmd = new AddTabToTabsetCommand(
      new Tab("tabId",ChromeApi.createChromeTabObject("title","https://www.skysail.io","")),
      new Tabset("tsId","tabset",[]))
    cmd.execute()
      .then((res) => {
        console.log("res", res)
      })
  });



});
