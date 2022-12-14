import {beforeEach, describe, expect, it} from "@jest/globals";
import {MarkTabsetDeletedCommand} from "src/domain/commands/MarkTabsetDeletedCommand";
import {useTabsStore} from "src/stores/tabsStore";
import {chrome} from "jest-chrome";
import {createPinia, setActivePinia} from "pinia";

describe('MarkTabsetDeletedCommand', () => {

  class Logger {

  }

  beforeEach(() => {
    setActivePinia(createPinia())
    //localStorageMock.clear()
  })

  it('tabs are initialized from chrome.tabs', async () => {

    //const tabsStore = useTabsStore()
    // chrome.tabs.query.mockImplementation(async (o: object) => [{id: 1}])
    //
    // //await tabsStore.initialize(localStorageMock)
    //
    // expect(tabsStore.tabs.length).toBe(1)
    // expect(tabsStore.tabsets.size).toBe(0)

    const cmd = new MarkTabsetDeletedCommand('tsid')
    const res = await cmd.execute(new Logger())
    // console.log("res", res)
    // const tabsStore = useTabsStore()
    // chrome.tabs.query.mockImplementation(async (o: object) => [{id: 1}])
    //
    // await tabsStore.initialize(localStorageMock)
    //
    // expect(tabsStore.tabs.length).toBe(1)
    // expect(tabsStore.tabsets.size).toBe(0)
  })

})
