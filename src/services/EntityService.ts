import PersistenceService from "src/services/PersistenceService";

let db: PersistenceService = null as unknown as PersistenceService

export function useEntitiesService() {

  const init = async (providedDb: PersistenceService,
                     ) => {
    console.debug(" ...initializing entitiesService as", providedDb.getServiceName())
    db = providedDb


    //await db.loadTabsets()

  }

  // const createEntity = (name: string) => {
  //   const entity = new Entity(uid(), name)
  //   db.saveEntity(entity)
  // }

  return {
    init
  }

}
