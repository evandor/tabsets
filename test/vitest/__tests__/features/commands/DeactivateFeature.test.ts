import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import InMemoryFeaturesPersistence from "src/features/persistence/InMemoryFeaturesPersistence";
import {ActivateFeatureCommand} from "src/features/commands/ActivateFeature";
import {AppFeatures} from "src/models/AppFeatures";
import {DeactivateFeatureCommand} from "src/features/commands/DeactivateFeature";

installQuasarPlugin();

vi.mock('vue-router')

describe('DeactivateFeatureCommand', () => {

  beforeEach(async () => {
    setActivePinia(createPinia())
    await useFeaturesStore().initialize(InMemoryFeaturesPersistence)
  })

  it('feature gets deactivated again', async () => {
    const feature = new AppFeatures().features[0]
    await new ActivateFeatureCommand(feature).execute()
    expect(useFeaturesStore().activeFeatures.indexOf(feature.ident.toLowerCase())).toBeGreaterThanOrEqual(0)
    await new DeactivateFeatureCommand(feature).execute()
    expect(useFeaturesStore().activeFeatures.length).toBe(0)
  })

  it('command has proper toString representation', async () => {
    const feature = new AppFeatures().features[0]
    const cmd = new DeactivateFeatureCommand(feature)
    expect(cmd.toString()).toBe("DeactivateFeatureCommand: {feature=TOP10}")
  })


});
