import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import ChromeApi from "src/services/ChromeApi";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import {Tab} from "src/models/Tab";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import {useTabsetService} from "src/services/TabsetService2";

installQuasarPlugin();

vi.mock('vue-router')

describe('AddTabToTabsetCommand', () => {

  const skysailChromeTab = ChromeApi.createChromeTabObject("title", "https://www.skysail.io", "favicon")

  // @ts-ignore
  // useRouter.mockReturnValue({
  //   push: vi.fn(),
  // })

  // // @ts-ignore
  // useRoute.mockReturnValue({
  //   query: {
  //     name,
  //   },
  // })

  beforeEach(async () => {
    setActivePinia(createPinia())
    // @ts-ignore
    //useRouter().push.mockReset()
  })

  it('adding new tab to tabset in empty db', async () => {
    await IndexedDbPersistenceService.init("db")

    const executionResult = await new CreateTabsetCommand("new Tabset", []).execute()

    const result = await new AddTabToTabsetCommand(new Tab("tabId", skysailChromeTab), executionResult.result.tabset).execute()
    expect(result.message).toBe("Tab was added")

    const tabsetFromDB = useTabsetService().getTabset("new Tabset")
    console.log("tabsetFromDB", tabsetFromDB)
  });


});
