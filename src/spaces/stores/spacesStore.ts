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
   * the (internal) storage for this store to use
   */
  let storage: SpacesPersistence = null as unknown as SpacesPersistence

  const throttleOne10Millis = throttledQueue(1, 10, true)

  /**
   * initialize store with
   * @param ps a persistence storage
   */
  async function initialize(p: SpacesPersistence) {
    // if (!isAuthenticated) {
    //   console.debug("%not authenticated", "font-weight:bold")
    //   storage = useDB(undefined).spacesIndexedDb
    // } else if (syncType === SyncType.FIRESTORE) {
    //   console.debug("%csyncType " + syncType, "font-weight:bold")
    //   storage = useDB(undefined).spacesFirestoreDb
    // } else {
    //   console.debug("%cfallback, syncType " + syncType, "font-weight:bold")
    //   storage = useDB().spacesIndexedDb
    // }
    storage = p

    await storage.init()

    // TODO remove after version 0.4.12
    await storage.migrate()

    // console.debug(' ...initialized spaces: Store', '✅')
    await storage.loadSpaces()
  }

  /**
   * reloads store
   */
  async function reload() {
    console.debug('reloading spacesStore')
    await storage.loadSpaces()
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

  // function addSpace(label: string): Promise<any>;
  // function addSpace(space: Space): Promise<any>;

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
    return Promise.resolve(newSpace)
  }

  /**
   * create a new space; checks if label already exists
   *
   * @param s
   */
  function addSpace(s: Space, addToStorage = true): Promise<any> {
    return throttleOne10Millis(async () => {
      //console.log("adding space", s.id, s.label)
      //console.log("spaces:", [...spaces.value.values()].length)
      if (nameExists.value(s.label)) {
        const msg = `name '${s.label}' does already exist`
        console.log('issue during adding spaces: ', msg)
        return Promise.resolve()
      }
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
  }
})
