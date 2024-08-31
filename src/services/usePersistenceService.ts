import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {LocalStorage, QVueGlobals, useQuasar} from "quasar";
import {LocalStoragePersistenceService} from "src/services/storage/LocalStoragePersistenceService";
import PersistenceService from "src/services/PersistenceService";
import SpacesPersistence from "src/spaces/persistence/SpacesPersistence";
import IndexedDbSpacesStorage from "src/spaces/persistence/IndexedDbSpacesPersistence";
import TabsetsPersistence from "src/tabsets/persistence/TabsetsPersistence";
import IndexedDbTabsetsPersistence from "src/tabsets/persistence/IndexedDbTabsetsPersistence";
import FeaturesPersistence from "src/features/persistence/FeaturesPersistence";
import {LocalStorageFeaturesPersistence} from "src/features/persistence/LocalStorageFeaturesPersistence";
import SnapshotsPersistence from "src/snapshots/persistence/SnapshotsPersistence";
import IndexedDbSnapshotPersistence from "src/snapshots/persistence/IndexedDbSnapshotPersistence";
import IndexedDbTabsetsGroupsPersistence from "src/tabsets/persistence/IndexedDbTabsetsGroupsPersistence";
import TabsetsGroupsPersistence from "src/tabsets/persistence/TabsetsGroupsPersistence";
import IndexedDbNotesPersistence from "src/notes/persistence/IndexedDbNotesPersistence";

export function useDB(quasar: QVueGlobals | undefined = undefined) {

  const db: PersistenceService = IndexedDbPersistenceService

  const spacesIndexedDb: SpacesPersistence = IndexedDbSpacesStorage

  const tabsetsIndexedDb: TabsetsPersistence = IndexedDbTabsetsPersistence
  const groupsIndexedDb: TabsetsGroupsPersistence = IndexedDbTabsetsGroupsPersistence

  const snapshotsIndexedDb: SnapshotsPersistence = IndexedDbSnapshotPersistence
  const notesDb =  IndexedDbNotesPersistence

  let localDb = undefined as unknown as PersistenceService
  let featuresLocalStorage: FeaturesPersistence = undefined as unknown as FeaturesPersistence
  if (quasar) {
    localDb = new LocalStoragePersistenceService(quasar)
    featuresLocalStorage = new LocalStorageFeaturesPersistence(quasar)
  }

  return {
    db, localDb, spacesIndexedDb,
    tabsetsIndexedDb,
    featuresLocalStorage,
    snapshotsIndexedDb,
    groupsIndexedDb,
    notesDb
  }

}
