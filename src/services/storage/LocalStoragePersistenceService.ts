import PersistenceService from "src/services/PersistenceService";
import {QVueGlobals, useQuasar} from "quasar";

export class LocalStoragePersistenceService implements PersistenceService {

  private quasar: QVueGlobals;

  constructor(quasar: QVueGlobals) {
    this.quasar = quasar
  }

  getServiceName(): string { return "LocalStoragePersistenceService" }

  deleteSpace(spaceId: string): void {
    throw new Error("Method not implemented.");
  }

  // saveActiveFeatures(val: string[]) {
  //   if (this.quasar.localStorage) {
  //     this.quasar.localStorage.set("ui.activeFeatures", val)
  //   } else {
  //     console.warn("local storage not defined")
  //   }
  // }
  //
  // setInactiveDefaultFeatures(val: string[]) {
  //   this.quasar.localStorage.set("ui.inActiveDefaultFeatures", val)
  // }
  //
  // getActiveFeatures(): Promise<string[]> {
  //   return Promise.resolve(this.quasar.localStorage?.getItem('ui.activeFeatures') as string[] || [])
  // }
  //
  // getInactiveDefaultFeatures(): Promise<string[]> {
  //   return Promise.resolve(this.quasar.localStorage?.getItem('ui.inActiveDefaultFeatures') as string[] || [])
  // }



  cleanUpRequests(): Promise<void> {
    return Promise.resolve(undefined);
  }

  compactDb(): Promise<any> {
    return Promise.resolve(undefined);
  }




  clear(name: string) {
  }


}
