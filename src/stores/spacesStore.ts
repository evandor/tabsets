import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch} from "vue";
import {Space} from "src/models/Space";
import {useTabsStore} from "src/stores/tabsStore";
import PersistenceService from "src/services/PersistenceService";
import {uid} from "quasar";

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
  const currentFromLocalStorage = localStorage.getItem("currentSpace")

  /**
   * the (internal) storage for this store to use
   */
  let storage: PersistenceService = null as unknown as PersistenceService

  /**
   * initialize store with
   * @param ps a persistence storage
   */
  async function initialize(ps: PersistenceService) {
    console.debug("initializing spacesStore", ps)
    storage = ps
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
        localStorage.setItem("currentSpace", spaceVal['id'])
      } else {
        localStorage.removeItem("currentSpace")
      }
      useTabsStore().currentTabsetId = null as unknown as string
    }, {deep: true}
  )

  /**
   * does this label already exist as a space label?
   */
  const nameExists = computed(() => {
    return (searchName: string) =>
      _.find([...spaces.value.values()], s => s.label === searchName?.trim())
  })

  function addSpace(label: string):Promise<any>;
  function addSpace(space: Space):Promise<any>;

  /**
   * create a new space; checks if label already exists
   *
   * @param s
   */
  function addSpace(s: string | Space):Promise<any> {
    const spaceId = s instanceof Space ? s.id : uid()
    const label =  s instanceof Space ? s.label : s
    console.log("adding space", spaceId, label)
    if (nameExists.value(label)) {
      return Promise.reject("name does already exist")
    }
    const newSpace = s instanceof Space ? s : new Space(spaceId, label)
    spaces.value.set(spaceId, newSpace)
    return storage.addSpace(newSpace)
  }

  function putSpace(s: Space) {
    spaces.value.set(s.id, s)
    if (s.id === currentFromLocalStorage) {
      space.value = s
    }
  }

  function setSpace(spaceId: string) {
    console.log("setting space to ", spaceId)
    space.value = null as unknown as Space
    const theSpace: Space | undefined = spaces.value.get(spaceId)
    if (theSpace) {
      space.value = theSpace
    }
  }

  function deleteById(spaceId: string) {
    console.log("deleting space", spaceId)
    spaces.value.delete(spaceId)
    if (spaceId === currentFromLocalStorage) {
      console.log("setting current space to null")
      space.value = null as unknown as Space
    }
    storage.deleteSpace(spaceId)
  }

  return {
    spaces,
    space,
    nameExists,
    initialize,
    addSpace,
    putSpace,
    setSpace,
    deleteById
  }
})
