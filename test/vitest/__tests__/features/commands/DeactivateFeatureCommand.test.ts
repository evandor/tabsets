import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import InMemoryFeaturesPersistence from "src/features/persistence/InMemoryFeaturesPersistence";
import {ActivateFeatureCommand} from "src/features/commands/ActivateFeatureCommand";
import {AppFeatures} from "src/app/models/AppFeatures";
import {DeactivateFeatureCommand} from "src/features/commands/DeactivateFeatureCommand";
import {Feature} from "src/features/models/Feature";
import {FeatureIdent} from "src/app/models/FeatureIdent";

installQuasarPlugin();

vi.mock('vue-router')

describe('DeactivateFeatureCommand', () => {

  beforeEach(async () => {
    setActivePinia(createPinia())
    await useFeaturesStore().initialize(InMemoryFeaturesPersistence)
  })

  it('feature gets deactivated again', async () => {
    const feature = new AppFeatures().features.find((f:Feature) => f.ident === FeatureIdent.TOP10)
    await new ActivateFeatureCommand(feature!.ident).execute()
    expect(useFeaturesStore().activeFeatures.indexOf(feature!.ident.toLowerCase())).toBeGreaterThanOrEqual(0)
    await new DeactivateFeatureCommand(feature!.ident).execute()
    expect(useFeaturesStore().activeFeatures.length).toBe(0)
  })

  it('command has proper toString representation', async () => {
    const feature = new AppFeatures().features.find((f:Feature) => f.ident === FeatureIdent.TOP10)
    const cmd = new DeactivateFeatureCommand(feature!.ident)
    expect(cmd.toString()).toBe("DeactivateFeatureCommand: {feature=TOP10}")
  })


});