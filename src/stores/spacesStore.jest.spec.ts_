import {beforeEach, describe, expect, it} from "@jest/globals";
import {createPinia, setActivePinia} from "pinia";
import "fake-indexeddb/auto"
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import {useSpacesStore} from "stores/spacesStore";
import {useDB} from "src/services/usePersistenceService";
import {Space} from "src/models/Space";

process.env.MODE = 'bex'

describe('SpacesStore', () => {

  const localStorageMock = (() => {
    let store = new Map<string, object>();
    return {
      getItem(key: string) {
        return store.get(key)
      },
      setItem(key: string, value: any) {
        store.set(key, value)
      },
      set(key: string, value: any) {
        store.set(key, value)
      },
      clear() {
        store = new Map<string, object>();
      },
      removeItem(key: string) {
        store.delete(key)
      },
      getAllKeys(): string[] {
        return [...store.keys()]
      }
    };
  })();

  beforeEach(async () => {
    localStorageMock.clear()
    setActivePinia(createPinia())
    const request = indexedDB.open('db', INDEX_DB_VERSION);
    request.onupgradeneeded = async function () {
      await useJestHelper().dbInit(request)
    }
    await IndexedDbPersistenceService.init("db")
    await useSpacesStore().initialize(useDB().db)
  })

  it('adding space with new label', async () => {
    const spaceStore = useSpacesStore()
    await spaceStore.createSpace("test")
    expect(spaceStore.spaces.size).toEqual(1)
  })

  it('adding space with existing label', async () => {
    await useSpacesStore().createSpace("test")
    await expect(useSpacesStore().createSpace("test")).rejects.toEqual("name does already exist")
  })

  it('adding space object', async () => {
    const spaceStore = useSpacesStore()
    await spaceStore.addSpace(new Space("id", "anotherlabel"))
    expect(spaceStore.spaces.get("id")?.label).toEqual("anotherlabel")
  })

  it('sets the current space by Id', async () => {
    const spaceStore = useSpacesStore()
    await spaceStore.addSpace(new Space("setSpaceId", "setSpaceLabel"))
    spaceStore.setSpace("setSpaceId")
    expect(spaceStore.space.label).toEqual("setSpaceLabel")
  })

  it('deletes by id', async () => {
    const spaceStore = useSpacesStore()
    await spaceStore.addSpace(new Space("deletedId", "deletedSpace"))
    expect(spaceStore.spaces.get("deletedId")?.label).toEqual("deletedSpace")
    await spaceStore.deleteById("deletedId")
    expect(spaceStore.spaces.get("deletedId")).toBe(undefined)
  })

})
