import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import PouchDbPersistenceService from "src/services/PouchDbPersistenceService";

export function useDB() {

  const localDb = IndexedDbPersistenceService // typically indexDB
  const db = IndexedDbPersistenceService // here: indexDB as well, firebase for tabsets pro
  const pouchDb = PouchDbPersistenceService

  return {
    localDb, db, pouchDb
  }

}
