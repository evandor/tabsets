import {uid} from "quasar";
import {useSpacesStore} from "stores/spacesStore";
import {useDB} from "src/services/usePersistenceService";

const {db} = useDB()

class SpacesService {

  /**
   * Init, called when extension is loaded (via App.vue)
   */
  async init() {
    console.debug("init spaces service")
    //await localDb.init();
    await db.loadSpaces()
  }

  addNewSpace(name: string): Promise<void> {
    const spacesStore = useSpacesStore()
    if (spacesStore.nameExists(name)) {
      return Promise.reject("name does already exist")
    }
    const spaceId = uid()
    const newSpace = spacesStore.addSpace(spaceId, name)
    return db.addSpace(newSpace)
  }

  deleteById(spaceId: string) {
    useSpacesStore().deleteById(spaceId)
    return db.deleteSpace(spaceId)
  }
}

export default new SpacesService();
