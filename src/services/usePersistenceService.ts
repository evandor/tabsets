import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {QVueGlobals, useQuasar} from "quasar";
import {LocalStoragePersistenceService} from "src/services/storage/LocalStoragePersistenceService";
import PersistenceService from "src/services/PersistenceService";
import FsPersistentService from "src/services/persistence/FirestorePersistenceService";
import SpacesPersistence from "src/spaces/persistence/SpacesPersistence";
import IndexedDbSpacesStorage from "src/spaces/persistence/IndexedDbSpacesStorage";

export function useDB(quasar: QVueGlobals | undefined = undefined) {

  const db: PersistenceService = IndexedDbPersistenceService
  const spacesIndexedDb: SpacesPersistence = IndexedDbSpacesStorage
  const spacesFirestoreDb: SpacesPersistence = IndexedDbSpacesStorage

  var localDb = undefined as unknown as PersistenceService
  if (quasar) {
    localDb = new LocalStoragePersistenceService(quasar)
  }
  var firestore = FsPersistentService

  return {
    db, localDb, firestore, spacesIndexedDb, spacesFirestoreDb
  }

}
