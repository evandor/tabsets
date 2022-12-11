import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";

class TabService {

  private persistenceService = IndexedDbPersistenceService

  updateThumbnail(url: string | undefined):Promise<void> {
    if (url) {
      return this.persistenceService.updateThumbnail(url)
    }
    console.log("could not update thumbnail")
    return Promise.resolve()
  }

  updateContent(url: string | undefined):Promise<object> {
    if (url) {
      return this.persistenceService.updateContent(url)
    }
    console.log("could not update thumbnail")
    return Promise.resolve({})
  }
}

export default new TabService()
