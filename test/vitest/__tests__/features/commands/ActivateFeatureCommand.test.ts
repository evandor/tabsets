import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia} from "pinia";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import InMemoryFeaturesPersistence from "src/features/persistence/InMemoryFeaturesPersistence";
import {ActivateFeatureCommand} from "src/features/commands/ActivateFeatureCommand";
import {AppFeatures} from "src/app/models/AppFeatures";
import {Feature} from "src/features/models/Feature";
import {FeatureIdent} from "src/app/models/FeatureIdent";

installQuasarPlugin();

vi.mock('vue-router')

describe('ActivateFeatureCommand', () => {

  beforeEach(async () => {
    setActivePinia(createPinia())
    await useFeaturesStore().initialize(InMemoryFeaturesPersistence)
  })

  it('feature gets activated', async () => {
    const feature = new AppFeatures().features.find((f:Feature) => f.ident === FeatureIdent.TOP10)
    const cmd = new ActivateFeatureCommand(feature!.ident)
    const res = await cmd.execute()
    expect(res.message).toBe("Feature top10 was activated")
    expect(useFeaturesStore().activeFeatures.indexOf(feature!.ident.toLowerCase())).toBeGreaterThanOrEqual(0)
  })

  it('command has proper toString representation', async () => {
    const feature = new AppFeatures().features.find((f:Feature) => f.ident === FeatureIdent.TOP10)
    const cmd = new ActivateFeatureCommand(feature!.ident)
    expect(cmd.toString()).toBe("ActivateFeatureCommand: {feature=TOP10}")
  })


});