import {uid} from "quasar";
import {useSpacesStore} from "src/stores/spacesStore";
import {useDB} from "src/services/usePersistenceService";
import {Space} from "src/models/Space";
import _ from "lodash"

const {db} = useDB(undefined)

const storage = db

class SpacesService {

  /**
   * Init, called when extension is loaded (via App.vue)
   */
  async init() {
    console.debug("init spaces service")
    //await localDb.init();
    await storage.loadSpaces()
  }

  addNewSpace(name: string): Promise<void> {
    const spacesStore = useSpacesStore()
    if (spacesStore.nameExists(name)) {
      return Promise.reject("name does already exist")
    }
    const spaceId = uid()
    const newSpace = spacesStore.addSpace(spaceId, name)
    return storage.addSpace(newSpace)
  }

  addNewSpaceFrom(s: Space): Promise<void> {
    const spacesStore = useSpacesStore()
    if (spacesStore.nameExists(s.label)) {
      return Promise.reject("name does already exist")
    }
    const newSpace = spacesStore.addSpaceFrom(s)
    return storage.addSpace(newSpace)
  }

  deleteById(spaceId: string) {
    useSpacesStore().deleteById(spaceId)
    return storage.deleteSpace(spaceId)
  }
  setSpaceFrom(spaceId:string) {
    const space = _.filter([...useSpacesStore().spaces.values()], (s:Space) => s.id === spaceId)
    if (space && space.length > 0) {
      useSpacesStore().space = space[0]
    }
  }
}

export default new SpacesService();
