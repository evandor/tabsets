import { QVueGlobals } from 'quasar'
import FeaturesPersistence from 'src/features/persistence/FeaturesPersistence'
import { LocalStorageFeaturesPersistence } from 'src/features/persistence/LocalStorageFeaturesPersistence'
import IndexedDbSnapshotPersistence from 'src/snapshots/persistence/IndexedDbSnapshotPersistence'
import SnapshotsPersistence from 'src/snapshots/persistence/SnapshotsPersistence'
import IndexedDbSpacesStorage from 'src/spaces/persistence/IndexedDbSpacesPersistence'
import SpacesPersistence from 'src/spaces/persistence/SpacesPersistence'
import IndexedDbSuggestionsPersistence from 'src/suggestions/persistence/IndexedDbSuggestionsPersistence'
import SuggestionsPersistence from 'src/suggestions/persistence/SuggestionsPersistence'
import CustomPagesPersistence from 'src/tabsets/persistence/cms/CustomPagesPersistence'
import IndexedDbCustomPagesPersistence from 'src/tabsets/persistence/cms/IndexedDbCustomPagesPersistence'
import IndexedDbTabsetsPersistence from 'src/tabsets/persistence/IndexedDbTabsetsPersistence'
import { LocalStorageTabsetsPersistence } from 'src/tabsets/persistence/LocalStorageTabsetsPersistence'
import TabsetsPersistence from 'src/tabsets/persistence/TabsetsPersistence'
import IndexedDbThumbnailsPersistence from 'src/thumbnails/persistence/IndexedDbThumbnailsPersistence'
import ThumbnailsPersistence from 'src/thumbnails/persistence/ThumbnailsPersistence'

export function useDB(quasar: QVueGlobals | undefined = undefined) {
  const spacesDb: SpacesPersistence = IndexedDbSpacesStorage
  const tabsetsDb: TabsetsPersistence = IndexedDbTabsetsPersistence

  const snapshotsDb: SnapshotsPersistence = IndexedDbSnapshotPersistence
  const suggestionsDb: SuggestionsPersistence = IndexedDbSuggestionsPersistence
  const thumbnailsDb: ThumbnailsPersistence = IndexedDbThumbnailsPersistence
  //const groupsIndexedDb: TabsetsGroupsPersistence = IndexedDbTabsetsGroupsPersistence

  let localStorageTabsetsDb: LocalStorageTabsetsPersistence = new LocalStorageTabsetsPersistence()

  let featuresDb: FeaturesPersistence = undefined as unknown as FeaturesPersistence
  if (quasar) {
    featuresDb = new LocalStorageFeaturesPersistence(quasar)
  }

  let pagesDb: CustomPagesPersistence = IndexedDbCustomPagesPersistence

  return {
    spacesDb,
    tabsetsDb,
    localStorageTabsetsDb,
    snapshotsDb,
    thumbnailsDb,
    // groupsIndexedDb,
    pagesDb,
    featuresDb,
    suggestionsDb,
  }
}
