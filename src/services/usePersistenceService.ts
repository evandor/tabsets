import { QVueGlobals } from 'quasar'
import FeaturesPersistence from 'src/features/persistence/FeaturesPersistence'
import { LocalStorageFeaturesPersistence } from 'src/features/persistence/LocalStorageFeaturesPersistence'
import IndexedDbNotesPersistence from 'src/notes/persistence/IndexedDbNotesPersistence'
import IndexedDbPersistenceService from 'src/services/IndexedDbPersistenceService'
import PersistenceService from 'src/services/PersistenceService'
import IndexedDbSnapshotPersistence from 'src/snapshots/persistence/IndexedDbSnapshotPersistence'
import SnapshotsPersistence from 'src/snapshots/persistence/SnapshotsPersistence'
import IndexedDbSpacesStorage from 'src/spaces/persistence/IndexedDbSpacesPersistence'
import SpacesPersistence from 'src/spaces/persistence/SpacesPersistence'
import IndexedDbTabsetsGroupsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsGroupsPersistence'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import { LocalStorageTabsetsPersistence } from 'src/tabsets/persistence/LocalStorageTabsetsPersistence'
import TabsetsGroupsPersistence from 'src/tabsets/persistence/TabsetsGroupsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import IndexedDbThumbnailsPersistence from 'src/thumbnails/persistence/IndexedDbThumbnailsPersistence'
import ThumbnailsPersistence from 'src/thumbnails/persistence/ThumbnailsPersistence'

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
    db,
    spacesDb,
    tabsetsIndexedDb,
    localStorageTabsetsDb,
    featuresDb,
    snapshotsDb,
    thumbnailsDb,
    groupsIndexedDb,
    notesDb,
  }
}
