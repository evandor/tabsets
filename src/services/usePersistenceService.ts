import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";

export function usePersistenceService() {

  /**
   * we use indexedDB here; can be replaced with firebase or something else if needed
   */
  return {
    IndexedDbPersistenceService
  }

}
