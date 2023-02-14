import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-jest';
import { mount } from '@vue/test-utils';
import StatsPage from "pages/StatsPage.vue";
import {createPinia, setActivePinia} from "pinia";
import LoggingService from "src/services/LoggingService";
import {useSearchStore} from "src/stores/searchStore";
import {INDEX_DB_VERSION} from "boot/constants";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useJestHelper} from "src/domain/JestHelper";
import {chrome} from "jest-chrome";

/*
 * You can provide a config object as param like such:
 *
 * ```ts
 * installQuasarPlugin({ plugins: { Dialog } });
 * ```
 */
installQuasarPlugin();

describe('BookComponent', () => {

  jest.setTimeout(10000)

  beforeEach(async () => {
    setActivePinia(createPinia())
    await LoggingService.init()
    await useSearchStore().init()
    const request = indexedDB.open('db', INDEX_DB_VERSION);
    request.onupgradeneeded = async function () {
      await useJestHelper().dbInit(request)
    }
    await IndexedDbPersistenceService.init()
    process.env.MODE = "bex"
    chrome.tabs.query.mockImplementation(async (o: object) => [])
  })

  it('mounts without errors', () => {
    const wrapper = mount(StatsPage);

    expect(wrapper).toBeTruthy();
  });
});
