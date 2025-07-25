import _ from 'lodash'
import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import { Space } from 'src/spaces/models/Space'
import SpacesPersistence from 'src/spaces/persistence/SpacesPersistence'
import throttledQueue from 'throttled-queue'
import { computed, ref, watch } from 'vue'

/**
 * a pinia store for "Spaces".
 *
 * Elements are persisted to the storage provided in the initialize function; the currently
 * selected space id is written to (and read from) local storage.
 */

export const useSpacesStore = defineStore('spaces', () => {
  /**
   * A Map of all spaces identified by their ids
   */
  const spaces = ref<Map<string, Space>>(new Map<string, Space>())

  /**
   * The currently selected space (or null)
   * TODO check: undefined instead of null breaks watch expression below
   */
  const space = ref<Space>(null as unknown as Space)

  /**
   * the value for the current space id from the localStorage (or null)
   */
  const currentFromLocalStorage = LocalStorage.getItem('currentSpace')

  /**
   * the persistence storage for this store
   */
  let storage: SpacesPersistence = null as unknown as SpacesPersistence

  const throttleOne10Millis = throttledQueue(1, 10, true)

  /**
   * initialize store with provided persistence storage and loads all spaces
   *
   * @param p the persistence storage
   */
  async function initialize(p: SpacesPersistence) {
    storage = p
    await storage.init()
    await storage.migrate()
    await loadSpaces()
  }

  /**
   * persist changes of current space to local storage to reuse on restart
   * // TODO pinia best practice 'do not use watch' !?
   * // https://climbtheladder.com/10-pinia-best-practices/
   */
  watch(
    space,
    (spaceVal: Space) => {
      console.log('spaceVal', spaceVal)
      if (spaceVal && spaceVal['id']) {
        localStorage.setItem('currentSpace', spaceVal['id'])
      } else {
        localStorage.removeItem('currentSpace')
      }
    },
    { deep: true },
  )

  const storeSize = computed(() => JSON.stringify([...spaces.value]).length)

  /**
   * does this label already exist as a space label?
   */
  const nameExists = computed(() => {
    return (searchName: string) => {
      return _.find([...spaces.value.values()], (s: Space) => {
        return s.label === searchName?.trim()
      })
    }
  })

  /**
   * create a new space
   */
  function addSpace(s: Space, addToStorage = true): Promise<any> {
    return throttleOne10Millis(async () => {
      console.log('adding space', s.id, s.label)
      spaces.value.set(s.id, s)
      if (addToStorage) {
        return storage.addSpace(s)
      }
    })
  }

  function putSpace(s: Space) {
    spaces.value.set(s.id, s)
    if (s.id === currentFromLocalStorage) {
      space.value = s
    }
  }

  function setSpace(spaceId: string | undefined) {
    console.log('setting space to ', spaceId)
    space.value = null as unknown as Space
    if (spaceId) {
      const theSpace: Space | undefined = spaces.value.get(spaceId)
      if (theSpace) {
        space.value = theSpace
      }
    }
  }

  function deleteById(spaceId: string) {
    console.log('deleting space', spaceId)
    spaces.value.delete(spaceId)
    if (spaceId === currentFromLocalStorage) {
      console.log('setting current space to null')
      space.value = null as unknown as Space
    }
    storage.deleteSpace(spaceId)
  }

  /**
   * Loads spaces from the storage.
   *
   */
  async function loadSpaces() {
    ;(await storage.getSpaces()).forEach((s: Space) => putSpace(s))
  }

  return {
    initialize,
    spaces,
    space,
    nameExists,
    loadSpaces,
    addSpace,
    setSpace,
    deleteById,
    storeSize,
  }
})
