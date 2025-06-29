import { QVueGlobals } from 'quasar'
import FirestoreFeaturesPersistence from 'src/ext/features/FirestoreFeaturesPersistence'
import FeaturesPersistence from 'src/features/persistence/FeaturesPersistence'
import PersistenceService from 'src/services/PersistenceService'
import FirestoreSnapshotsPersistence from 'src/snapshots/persistence/FirestoreSnapshotsPersistence'
import SnapshotsPersistence from 'src/snapshots/persistence/SnapshotsPersistence'
import FirestoreSpacesPersistence from 'src/spaces/persistence/FirestoreSpacesPersistence'
import SpacesPersistence from 'src/spaces/persistence/SpacesPersistence'
import FirestoreSuggestionsPersistence from 'src/suggestions/persistence/FirestoreSuggestionsPersistence'
import SuggestionsPersistence from 'src/suggestions/persistence/SuggestionsPersistence'
import FirestoreTabsetsPersistence from 'src/tabsets/persistence/FirestoreTabsetsPersistence'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import { LocalStorageTabsetsPersistence } from 'src/tabsets/persistence/LocalStorageTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import FirestoreThumbnailsPersistence from 'src/thumbnails/persistence/FirestoreThumbnailsPersistence'
import ThumbnailsPersistence from 'src/thumbnails/persistence/ThumbnailsPersistence'

export function useDB(quasar: QVueGlobals | undefined = undefined) {
  const spacesDb: SpacesPersistence = FirestoreSpacesPersistence
  const tabsetsDb: TabsetsPersistence = FirestoreTabsetsPersistence
  const localTabsetsDb: TabsetsPersistence = IndexedDbTabsetsPersistence

  const featuresDb: FeaturesPersistence = FirestoreFeaturesPersistence

  const snapshotsDb: SnapshotsPersistence = FirestoreSnapshotsPersistence
  const suggestionsDb: SuggestionsPersistence = FirestoreSuggestionsPersistence
  const thumbnailsDb: ThumbnailsPersistence = FirestoreThumbnailsPersistence

  let localDb = undefined as unknown as PersistenceService

  let localStorageTabsetsDb: LocalStorageTabsetsPersistence = new LocalStorageTabsetsPersistence()

  return {
    //db,
    localDb,
    spacesDb,
    tabsetsDb,
    localTabsetsDb,
    localStorageTabsetsDb,
    snapshotsDb,
    thumbnailsDb,
    featuresDb,
    suggestionsDb,
  }
}
