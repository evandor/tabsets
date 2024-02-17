import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {QVueGlobals, useQuasar} from "quasar";
import {LocalStoragePersistenceService} from "src/services/storage/LocalStoragePersistenceService";
import PersistenceService from "src/services/PersistenceService";
import GitPersistentService from "src/services/persistence/GitPersistentService";
import FsPersistentService from "src/services/persistence/FsPersistenceService";

export function useDB(quasar: QVueGlobals | undefined = undefined) {

  const db: PersistenceService = IndexedDbPersistenceService
  //const pouchDb: PersistenceService = PouchDbPersistenceService
  var localDb = undefined as unknown as PersistenceService
  if (quasar) {
    localDb = new LocalStoragePersistenceService(quasar)
  }
  var gitDb: PersistenceService = GitPersistentService
  var firestore = FsPersistentService

  return {
    db, localDb, gitDb, firestore
  }

}
