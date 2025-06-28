import Persistence from 'src/core/persistence/Persistence'

interface FeaturesPersistence extends Persistence {
  getActiveFeatures(): Promise<string[]>

  saveActiveFeatures(val: string[]): any
}

export default FeaturesPersistence
