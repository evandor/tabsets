import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {QVueGlobals} from "quasar";
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
import ThumbnailsPersistence from "src/thumbnails/persistence/ThumbnailsPersistence";
import IndexedDbThumbnailsPersistence from "src/thumbnails/persistence/IndexedDbThumbnailsPersistence";
import {LocalStorageTabsetsPersistence} from "src/tabsets/persistence/LocalStorageTabsetsPersistence";

export function useDB(quasar: QVueGlobals | undefined = undefined) {

  const db: PersistenceService = IndexedDbPersistenceService

  const spacesDb: SpacesPersistence = IndexedDbSpacesStorage

  const tabsetsIndexedDb: TabsetsPersistence = IndexedDbTabsetsPersistence
  const groupsIndexedDb: TabsetsGroupsPersistence = IndexedDbTabsetsGroupsPersistence

  const snapshotsDb: SnapshotsPersistence = IndexedDbSnapshotPersistence
  const notesDb = IndexedDbNotesPersistence

  const thumbnailsDb: ThumbnailsPersistence = IndexedDbThumbnailsPersistence

  let localStorageTabsetsDb: LocalStorageTabsetsPersistence = new LocalStorageTabsetsPersistence()

  let featuresDb: FeaturesPersistence = undefined as unknown as FeaturesPersistence
  if (quasar) {
    featuresDb = new LocalStorageFeaturesPersistence(quasar)
  }

  return {
    db, spacesDb,
    tabsetsIndexedDb, localStorageTabsetsDb,
    featuresDb,
    snapshotsDb,
    thumbnailsDb,
    groupsIndexedDb,
    notesDb
  }

}
