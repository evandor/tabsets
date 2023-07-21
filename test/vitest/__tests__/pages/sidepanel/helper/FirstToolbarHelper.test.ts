import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {mount} from '@vue/test-utils';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import {useTabsStore} from "stores/tabsStore";
import ChromeApi from "src/services/ChromeApi";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";

installQuasarPlugin();

describe('FirstToolbarHelper', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")

  beforeEach(async () => {
    setActivePinia(createPinia())
  })

  it('should be mounted', async () => {
    await IndexedDbPersistenceService.init("db")
    useTabsStore().setCurrentChromeTab(skysailChromeTab)
    const wrapper = mount(FirstToolbarHelper);
    console.log("hier", wrapper.html())
    expect(wrapper.text()).toContain("My Tabsets");
    expect(wrapper.text()).not.toContain("search");
  });

  it('should allow toggling of search', async () => {
    await IndexedDbPersistenceService.init("db")
    const wrapper = mount(FirstToolbarHelper);

    // need at least two tabsets
    await new CreateTabsetCommand("new Tabset A", []).execute()
    await new CreateTabsetCommand("new Tabset B", []).execute()

    await wrapper.get('#toggleSearchBtn').trigger("click")

    expect(wrapper.text()).toContain("search");
    expect(wrapper.text()).not.toContain("My Tabsets");
  });


});
