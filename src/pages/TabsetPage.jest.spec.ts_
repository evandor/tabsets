import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";
import "fake-indexeddb/auto"
// needs to be listed before IndexedDbPersistenceService!
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import ChromeApi from "src/services/ChromeApi";
import {useSearchStore} from "src/stores/searchStore";
import {installQuasarPlugin} from "@quasar/quasar-app-extension-testing-unit-jest";
import {Dialog} from "quasar";
import TabsetPage from "pages/TabsetPage.vue";
import {shallowMount} from "@vue/test-utils";

installQuasarPlugin({plugins: {Dialog}});

jest.mock('vue-router')

describe('BookComponent', () => {

  //jest.setTimeout(10000)


  beforeEach(async () => {
    setActivePinia(createPinia())
    await useSearchStore().init()
    const request = indexedDB.open('db', INDEX_DB_VERSION);
    request.onupgradeneeded = async function () {
      await useJestHelper().dbInit(request)
    }
    await IndexedDbPersistenceService.init("db")
    process.env.MODE = "bex"
    chrome.tabs.query.mockImplementation(async (o: object) => [])
  })

  it('mounts without errors', async () => {
    require('vue-router').useRoute.mockReturnValueOnce({query: {}})
    const wrapper = shallowMount(TabsetPage);
    expect(wrapper).toBeTruthy();
  });

  // it('congrats message for query param true and tabset not empty', async () => {
  //   await new CreateTabsetCommand("tabset", [ChromeApi.createChromeTabObject("t1", "https://www.skysail.io", "")]).execute()
  //   require('vue-router').useRoute.mockReturnValueOnce({query: {first: true}})
  //   const wrapper = shallowMount(TabsetPage);
  //   expect(wrapper.html()).toContain("Congrats")
  // });

  it('no congrats message for query param false', async () => {
    await new CreateTabsetCommand("tabset", [ChromeApi.createChromeTabObject("t1", "https://www.skysail.io", "")]).execute()
    require('vue-router').useRoute.mockReturnValueOnce({query: {first: false}})
    const wrapper = shallowMount(TabsetPage);
    expect(wrapper.html()).not.toContain("Congrats")
  });
});
