import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {mount} from '@vue/test-utils';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import CurrentTabElementHelper from "pages/sidepanel/helper/CurrentTabElementHelper.vue";
import {useTabsStore} from "stores/tabsStore";
import ChromeApi from "src/services/ChromeApi";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useTabsetService} from "src/services/TabsetService2";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import {Tab} from "src/models/Tab";
import {uid} from "quasar";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";

installQuasarPlugin();

describe('FirstToolbarHelper', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")

  beforeEach(async () => {
    setActivePinia(createPinia())
  })

  it('should be mounted from chrome tab', async () => {
    await IndexedDbPersistenceService.init("db")
    useTabsStore().setCurrentChromeTab(skysailChromeTab)
    const wrapper = mount(FirstToolbarHelper);
    expect(wrapper.text()).toContain("www.skysail.io");
    expect(wrapper.text()).toContain("save in");
    expect(wrapper.text()).toContain("title");
    expect(wrapper.text()).toContain("www.skysail.io");
  });



});
