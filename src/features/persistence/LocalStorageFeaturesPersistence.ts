import { QVueGlobals } from 'quasar'
import FeaturesPersistence from 'src/features/persistence/FeaturesPersistence'

export class LocalStorageFeaturesPersistence implements FeaturesPersistence {
  private quasar: QVueGlobals

  constructor(quasar: QVueGlobals) {
    this.quasar = quasar
  }

  getServiceName(): string {
    return this.constructor.name
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined)
  }

  getActiveFeatures(): Promise<string[]> {
    return Promise.resolve((this.quasar.localStorage?.getItem('ui.activeFeatures') as string[]) || [])
  }

  init(): Promise<any> {
    return Promise.resolve(undefined)
  }

  saveActiveFeatures(val: string[]) {
    if (this.quasar.localStorage) {
      this.quasar.localStorage.set('ui.activeFeatures', val)
    } else {
      console.warn('local storage not defined')
    }
  }
}

//export default new LocalStorageFeaturesPersistence()
