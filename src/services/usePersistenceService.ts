import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";

export function useDB() {

  const db = IndexedDbPersistenceService // here: indexDB as well, firebase for tabsets pro

  return {
    db
  }

}
