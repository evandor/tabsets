import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {QVueGlobals, useQuasar} from "quasar";
import {LocalStoragePersistenceService} from "src/services/storage/LocalStoragePersistenceService";
import PersistenceService from "src/services/PersistenceService";
import FsPersistentService from "src/services/persistence/FirestorePersistenceService";
import SpacesPersistence from "src/spaces/persistence/SpacesPersistence";
import IndexedDbSpacesStorage from "src/spaces/persistence/IndexedDbSpacesStorage";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import IndexedDbTabsetsPersistence from "src/tabsets/persistence/IndexedDbTabsetsPersistence";
import FirestoreTabsetsPersistence from "src/tabsets/persistence/FirestoreTabsetsPersistence";
import FirestoreSpacesPersistence from "src/spaces/persistence/FirestoreSpacesPersistence";
import FeaturesPersistence from "src/features/persistence/FeaturesPersistence";
import IndexedDbFeaturesPersistence from "src/features/persistence/IndexedDbFeaturesPersistence";

export function useDB(quasar: QVueGlobals | undefined = undefined) {

  const db: PersistenceService = IndexedDbPersistenceService

  const spacesIndexedDb: SpacesPersistence = IndexedDbSpacesStorage
  const spacesFirestoreDb: SpacesPersistence = FirestoreSpacesPersistence

  const tabsetsIndexedDb: TabsetsPersistence = IndexedDbTabsetsPersistence
  const tabsetsFirestoreDb: TabsetsPersistence = FirestoreTabsetsPersistence

  const featuresIndexedDb: FeaturesPersistence = IndexedDbFeaturesPersistence

  var localDb = undefined as unknown as PersistenceService
  if (quasar) {
    localDb = new LocalStoragePersistenceService(quasar)
  }
  var firestore = FsPersistentService

  return {
    db, localDb, firestore, spacesIndexedDb, spacesFirestoreDb,
    tabsetsIndexedDb, tabsetsFirestoreDb,
    featuresIndexedDb
  }

}
