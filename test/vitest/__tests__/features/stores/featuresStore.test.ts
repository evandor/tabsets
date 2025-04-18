import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import InMemoryFeaturesPersistence from 'src/features/persistence/InMemoryFeaturesPersistence'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

installQuasarPlugin()

vi.mock('vue-router')

describe('FeaturesStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())

    // https://groups.google.com/a/chromium.org/g/chromium-extensions/c/hssoAlvluW8
    const chromeMock = {
      permissions: {
        getAll: vi.fn(() => {
          return Promise.resolve([])
        }),
      },
      runtime: {
        sendMessage: vi.fn(() => {}),
      },
    }

    vi.stubGlobal('chrome', chromeMock)

    await useFeaturesStore().initialize(InMemoryFeaturesPersistence)
  })

  it('initializes correctly with local storage', async () => {
    const features = useFeaturesStore().activeFeatures
    expect(features.length).toBe(0)
  })

  it('adds valid feature', async () => {
    useFeaturesStore().activateFeature('top10')
    expect(useFeaturesStore().activeFeatures.length).toBe(1)
    expect(useFeaturesStore().activeFeatures[0]).toBe('top10')
  })

  it('adds valid feature', async () => {
    useFeaturesStore().activateFeature('top10')
    expect(useFeaturesStore().activeFeatures.length).toBe(1)
    expect(useFeaturesStore().activeFeatures[0]).toBe('top10')
  })

  it('does not add invalid feature', async () => {
    expect(() => useFeaturesStore().activateFeature('unknownFeature')).toThrowError(
      /^unknown feature called unknownFeature$/,
    )
  })

  it('adds valid feature only once', async () => {
    useFeaturesStore().activateFeature('top10')
    useFeaturesStore().activateFeature('top10')
    expect(useFeaturesStore().activeFeatures.length).toBe(1)
    expect(useFeaturesStore().activeFeatures[0]).toBe('top10')
  })

  it('removes Feature again', async () => {
    useFeaturesStore().activateFeature('top10')
    expect(useFeaturesStore().activeFeatures.length).toBe(1)
    useFeaturesStore().deactivateFeature('top10')
    expect(useFeaturesStore().activeFeatures.length).toBe(0)
  })

  it('has added feature', async () => {
    useFeaturesStore().activateFeature('top10')
    expect(useFeaturesStore().activeFeatures.length).toBe(1)
    expect(useFeaturesStore().hasFeature(FeatureIdent.TOP10)).toBe(true)
  })
})
