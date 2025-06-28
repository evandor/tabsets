import FeaturesPersistence from 'src/features/persistence/FeaturesPersistence'

class InMemoryFeaturesPersistence implements FeaturesPersistence {
  features: string[] = []

  getServiceName(): string {
    return this.constructor.name
  }

  async init() {
    this.features = []
    return Promise.resolve()
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  getActiveFeatures(): Promise<string[]> {
    return Promise.resolve(this.features)
  }

  saveActiveFeatures(fs: string[]): any {
    this.features = fs
  }
}

export default new InMemoryFeaturesPersistence()
