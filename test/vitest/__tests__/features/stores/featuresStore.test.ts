import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useDB} from "src/services/usePersistenceService";
import PersistenceService from "src/services/PersistenceService";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import InMemoryFeaturesPersistence from "src/features/persistence/InMemoryFeaturesPersistence";
import {FeatureIdent} from "src/models/FeatureIdent";

installQuasarPlugin();

vi.mock('vue-router')

describe('FeaturesStore', () => {

  let db = null as unknown as PersistenceService

  beforeEach(async () => {
    setActivePinia(createPinia())
    await IndexedDbPersistenceService.init("db")
    db = useDB(undefined).db

    // https://groups.google.com/a/chromium.org/g/chromium-extensions/c/hssoAlvluW8
    const chromeMock = {
      permissions: {
        getAll: vi.fn(() => {
          return Promise.resolve([])
        }),
      },
      runtime: {
        sendMessage: vi.fn(() => {
        })
      }
    };

    vi.stubGlobal('chrome', chromeMock);

    await useFeaturesStore().initialize(InMemoryFeaturesPersistence)
  })

  it('initializes correctly with local storage', async () => {
    const features = useFeaturesStore().activeFeatures
    expect(features.length).toBe(0)
  })

  it('adds valid feature', async () => {
    useFeaturesStore().activateFeature("top10")
    expect(useFeaturesStore().activeFeatures.length).toBe(1)
    expect(useFeaturesStore().activeFeatures[0]).toBe("top10")
  })

  it('adds valid feature', async () => {
    useFeaturesStore().activateFeature("top10")
    expect(useFeaturesStore().activeFeatures.length).toBe(1)
    expect(useFeaturesStore().activeFeatures[0]).toBe("top10")
  })

  it('does not add invalid feature', async () => {
    expect(() => useFeaturesStore().activateFeature("unknownFeature")).toThrowError(
      /^unknown feature called unknownFeature$/,
    )
  })

  it('adds valid feature only once', async () => {
    useFeaturesStore().activateFeature("top10")
    useFeaturesStore().activateFeature("top10")
    expect(useFeaturesStore().activeFeatures.length).toBe(1)
    expect(useFeaturesStore().activeFeatures[0]).toBe("top10")
  })

  it('removes Feature again', async () => {
    useFeaturesStore().activateFeature("top10")
    expect(useFeaturesStore().activeFeatures.length).toBe(1)
    useFeaturesStore().deactivateFeature("top10")
    expect(useFeaturesStore().activeFeatures.length).toBe(0)
  })

  it('has added feature', async () => {
    useFeaturesStore().activateFeature("top10")
    expect(useFeaturesStore().activeFeatures.length).toBe(1)
    expect(useFeaturesStore().hasFeature(FeatureIdent.TOP10)).toBe(true)
  })

});
