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

installQuasarPlugin();

describe('CurrentTabElementHelper', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")

  beforeAll(async () => {

  })

  beforeEach(async () => {
    setActivePinia(createPinia())
  })

  it('should be mounted from chrome tab', async () => {
    await IndexedDbPersistenceService.init("db")
    useTabsStore().setCurrentChromeTab(skysailChromeTab)
    const wrapper = mount(CurrentTabElementHelper);
    expect(wrapper.text()).toContain("www.skysail.io");
    expect(wrapper.text()).toContain("save in");
    expect(wrapper.text()).toContain("title");
    expect(wrapper.text()).toContain("www.skysail.io");
  });

  it('should be mounted with missing chrome tab', async () => {
    await IndexedDbPersistenceService.init("db")
    const wrapper = mount(CurrentTabElementHelper);
    expect(wrapper.text()).toContain("Current Tab");
  });

  it('should be mounted from existing chrome tab', async () => {
    await IndexedDbPersistenceService.init("db")
    useTabsStore().setCurrentChromeTab(skysailChromeTab)
    const res = await useCommandExecutor().execute(new CreateTabsetCommand("ts1", []))
    useCommandExecutor().execute(new AddTabToTabsetCommand(new Tab(uid(), skysailChromeTab), res.result.tabset))
    await useTabsetService().saveText(skysailChromeTab, "the text", {})
    const wrapper = mount(CurrentTabElementHelper);
    expect(wrapper.text()).toContain("saved in");
    expect(wrapper.text()).toContain("ts1");
  });

});
