import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {uid} from "quasar";
import {useSpacesStore} from "stores/spacesStore";

class SpacesService {

  private persistenceService = IndexedDbPersistenceService

  /**
   * Init, called when extension is loaded (via App.vue)
   */
  async init() {
    console.debug("init spaces service")
    //await this.persistenceService.init();
    await this.persistenceService.loadSpaces()
  }

  addNewSpace(name: string): Promise<void> {
    const spacesStore = useSpacesStore()
    if (spacesStore.nameExists(name)) {
      return Promise.reject("name does already exist")
    }
    const spaceId = uid()
    const newSpace = spacesStore.addSpace(spaceId, name)
    return this.persistenceService.addSpace(newSpace)
  }

  deleteById(spaceId: string) {
    useSpacesStore().deleteById(spaceId)
    return this.persistenceService.deleteSpace(spaceId)
  }
}

export default new SpacesService();
