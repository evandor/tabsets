import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";

export function useDB() {

  const localDb = IndexedDbPersistenceService // typically indexDB
  const db = IndexedDbPersistenceService // here: indexDB as well, firebase for tabsets pro

  return {
    localDb, db
  }

}
