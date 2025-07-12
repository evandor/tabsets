import _ from 'lodash'
import { defineStore } from 'pinia'
import { LocalStorage, uid } from 'quasar'
import { useNavigationService } from 'src/core/services/NavigationService'
import { Space } from 'src/spaces/models/Space'
import SpacesPersistence from 'src/spaces/persistence/SpacesPersistence'
import { useAuthStore } from 'src/stores/authStore'
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
   * initialize store with
   * @param p the persistence storage
   */
  async function initialize(p: SpacesPersistence) {
    storage = p
    await storage.init()
    await storage.migrate()
    const spaces = await storage.getSpaces()
    spaces.forEach((s: Space) => {
      useSpacesStore().putSpace(s)
    })
    console.log('loaded with', storeSize.value)
  }

  /**
   * reloads store
   */
  async function reload() {
    console.debug('reloading spacesStore')
    const spaces = await storage.getSpaces()
    spaces.forEach((s: Space) => {
      useSpacesStore().putSpace(s)
    })
  }

  /**
   * persist changes of current space to local storage to reuse on restart
   * // TODO pinia best practice 'do not use watch' !?
   * // https://climbtheladder.com/10-pinia-best-practices/
   */
  watch(
    space,
    (spaceVal: Space) => {
      if (spaceVal && spaceVal['id']) {
        localStorage.setItem('currentSpace', spaceVal['id'])
      } else {
        localStorage.removeItem('currentSpace')
      }
    },
    { deep: true },
  )

  const storeSize = computed(() => {
    return JSON.stringify([...spaces.value]).length
  })

  /**
   * does this label already exist as a space label?
   */
  const nameExists = computed(() => {
    return (searchName: string) => {
      //console.log("checking for existence --- ", searchName)
      return _.find([...spaces.value.values()], (s: Space) => {
        //console.log("comparing", s.label, searchName?.trim(), s.label === searchName?.trim())
        return s.label === searchName?.trim()
      })
    }
  })

  /**
   * create a new space; checks if label already exists
   *
   * @param label
   */
  async function createSpace(label: string): Promise<Space> {
    const exceedInfo = useAuthStore().limitExceeded('SPACES', spaces.value.size)
    if (exceedInfo.exceeded) {
      await useNavigationService().browserTabFor(
        chrome.runtime.getURL(
          `/www/index.html#/mainpanel/settings?tab=account&exceeded=spaces&limit=${exceedInfo.limit}`,
        ),
      )
      return Promise.reject('tabsetLimitExceeded')
    }

    const spaceId = uid()
    console.log('adding space', spaceId, label)
    if (nameExists.value(label)) {
      return Promise.reject(`name '${label}'does already exist`)
    }
    const newSpace = new Space(spaceId, label)
    spaces.value.set(spaceId, newSpace)
    await storage.addSpace(newSpace)
    console.log('spaces store size', storeSize.value)
    return Promise.resolve(newSpace)
  }

  /**
   * create a new space; checks if label already exists
   */
  function addSpace(s: Space, addToStorage = true): Promise<any> {
    return throttleOne10Millis(async () => {
      console.log('adding space', s.id, s.label)
      //console.log("spaces:", [...spaces.value.values()].length)
      if (nameExists.value(s.label)) {
        const msg = `name '${s.label}' does already exist`
        console.log('issue during adding spaces: ', msg)
        return Promise.resolve()
      }
      spaces.value.set(s.id, s)
      console.log('size before adding', storeSize.value)
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

  return {
    spaces,
    space,
    nameExists,
    initialize,
    reload,
    createSpace,
    addSpace,
    putSpace,
    setSpace,
    deleteById,
    storeSize,
  }
})
