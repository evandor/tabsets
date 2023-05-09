import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {QVueGlobals} from "quasar";
import {LocalStoragePersistenceService} from "src/services/storage/LocalStoragePersistenceService";

export function useDB(quasar: QVueGlobals | undefined = undefined) {

  const db = IndexedDbPersistenceService // here: indexDB as well, pouchdb for tabsets pro
  var localDb  = undefined
  if (quasar) {
    localDb = new LocalStoragePersistenceService(quasar)
  }

  return {
    db,localDb
  }

}
