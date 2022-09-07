import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {mount} from "@vue/test-utils";
import MyButton from "app/test/jest/__tests__/demo/MyButton.vue";
import { setActivePinia, createPinia } from 'pinia'
import {useTabsStore} from "src/stores/tabsStore";
import {LocalStorage, useQuasar} from "quasar";
import { chrome } from 'jest-chrome'

describe('TabsStore', () => {

  const localStorageMock = (() => {
    let store = new Map<string, object>();
    return {
      getItem(key: string) {
        return "a"//store[key as keyof string];
      },
      setItem(key:string, value:any) {
        console.log("setting key", key, value)
        store.set(key, value)
      },
      clear() {
        store = new Map<string, object>();
      },
      removeItem(key:string) {
        //delete store[key];
      },
      getAllKeys(): string[] {
        console.log("getting keys of", store.keys())
        return [...store.keys()]
      }
    };
  })();

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('tabs are initialized from chrome.tabs', async () => {
    const tabsStore = useTabsStore()
    chrome.tabs.query.mockImplementation( async (o: object) => {
      return [{}]
    })
    await tabsStore.initialize(localStorageMock)
    expect(tabsStore.tabs.length).toBe(1)
    expect(tabsStore.tabsets.size).toBe(1)
    //expect(localStorageMock.getAllKeys().length).toBe(1)
  })

  it('has increment method', () => {

  });
})
