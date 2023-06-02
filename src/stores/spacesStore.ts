import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch} from "vue";
import {Space} from "src/models/Space";
import {useTabsStore} from "src/stores/tabsStore";
import {useDB} from "src/services/usePersistenceService";

/**
 * a pinia store for "Spaces".
 *
 * TODO: what's in here, and what belongs to the SpacesService?
 * TODO: where are things persisted?
 *
 * Idea: keep state private and use the service to get and change things
 */

const {db} = useDB(undefined)

const storage = db

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

  function initialize() {
    console.log("initializing spacesStore", storage)
  }

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

  const nameExists = computed(() => {
    return (searchName: string) => {
      const spaceArray = [...spaces.value.values()]
      return _.find(spaceArray, s => s.label === searchName?.trim())
    }
  })

  function addSpace(key: string, label: string): Space {
    console.log("adding space", key, label)
    const newSpace = new Space(key, label)
    spaces.value.set(key, newSpace)
    return newSpace
  }

  function addSpaceFrom(space: Space): Space {
    console.log("adding space", space)
    spaces.value.set(space.id, space)
    return space
  }

  function putSpace(s: Space) {
    // console.log("putting space", s.id, s)
    spaces.value.set(s.id, s)
    if (s.id === currentFromLocalStorage) {
      // console.log("setting current space to ", s)
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
  }

  return {
    spaces,
    space,
    nameExists,
    initialize,
    addSpace,
    putSpace,
    setSpace,
    deleteById,
    addSpaceFrom
  }
})
