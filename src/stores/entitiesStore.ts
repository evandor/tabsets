import {defineStore} from "pinia";
import {computed, ref} from "vue";
import PersistenceService from "src/services/PersistenceService";
import {Entity} from "src/models/Entity";
import {uid} from "quasar";


export const useEntitiesStore = defineStore('entities', () => {

  /**
   * the (internal) storage for this store to use
   */
  let storage: PersistenceService = null as unknown as PersistenceService

  const entities = ref<Entity[]>([])
  const updated = ref<number>(new Date().getTime())

  /**
   * initialize store with
   *
   * @param ps a storage
   */
  async function initialize(ps: PersistenceService) {
    console.debug(" ...initializing entities store")
    storage = ps
    entities.value = await storage.getEntities()
    updated.value = new Date().getTime()
  }

  async function createEntity(name: string) {
    storage.saveEntity(new Entity(uid(), name))
    entities.value = await storage.getEntities()
    updated.value = new Date().getTime()
  }

  async function save(e: Entity) {
    console.log("saving", e)
    await storage.saveEntity(JSON.parse(JSON.stringify(e)))
    // await storage.saveEntity(e)
    entities.value = await storage.getEntities()
    updated.value = new Date().getTime()
  }

  async function findById(id: string):Promise<Entity | undefined> {
    console.log("findbyid", id, storage)
    if (storage) {
      return await storage.findEntityById(id)
    }
    return Promise.resolve(undefined)
  }

  const getEntities = computed(() => entities.value)

  return {
    initialize,
    createEntity,
    save,
    getEntities,
    findById,
    updated
  }
})


