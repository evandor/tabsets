import {defineStore} from 'pinia';
import _ from 'lodash'
import {computed, ref, watch, watchEffect} from "vue";
import {Space} from "src/models/Space";
import {useTabsStore} from "src/stores/tabsStore";
import PersistenceService from "src/services/PersistenceService";
import {uid} from "quasar";
import {Tabset} from "src/models/Tabset";
import {Category} from "src/models/Category";

/**
 * a pinia store for categorized "remote" tabsets used for suggestions.
 *
 * Elements are persisted to the storage provided in the initialize function
 */

export const useCategoriesStore = defineStore('categoriesStore', () => {

  /**
   * A Map of all categories identified by their ids
   */
  const categories = ref<Map<string, Category>>(new Map<string, Category>())

  /**
   */
  const category = ref<Space>(null as unknown as Category)

  /**
   * the (internal) storage for this store to use
   */
  let storage: PersistenceService = null as unknown as PersistenceService

  /**
   * initialize store with
   * @param ps a persistence storage
   */
  async function initialize(ps: PersistenceService) {
    console.debug("initializing categoriesSpace", ps)
    storage = ps
    await storage.loadCategories()
  }

  /**
   * reloads store
   */
  async function reload() {
    console.debug("reloading categoriesSpace")
    await storage.loadCategories()
  }

  /**
   * persist changes of current space to local storage to reuse on restart
   * // TODO pinia best practice 'do not use watch' !?
   * // https://climbtheladder.com/10-pinia-best-practices/
   */
  // watch(
  //   space,
  //   (spaceVal: Space) => {
  //     if (spaceVal && spaceVal['id']) {
  //       localStorage.setItem("currentSpace", spaceVal['id'])
  //     } else {
  //       localStorage.removeItem("currentSpace")
  //     }
  //     // console.log("setting tabsetid to null")
  //     //useTabsStore().currentTabsetId = null as unknown as string
  //   }, {deep: true}
  // )

  /**
   * create a new space; checks if label already exists
   *
   * @param s
   */
  // function createSpace(label: string): Promise<any> {
  //   const spaceId = uid()
  //   console.log("adding space", spaceId, label)
  //   if (nameExists.value(label)) {
  //     return Promise.reject("name does already exist")
  //   }
  //   const newSpace = new Space(spaceId, label)
  //   spaces.value.set(spaceId, newSpace)
  //   return storage.addSpace(newSpace)
  // }

  /**
   * create a new space; checks if label already exists
   *
   * @param s
   */
  // function addSpace(s: Space): Promise<any> {
  //   console.log("adding space", s.id, s.label)
  //   if (nameExists.value(s.label)) {
  //     return Promise.reject("name does already exist")
  //   }
  //   spaces.value.set(s.id, s)
  //   return storage.addSpace(s)
  // }

  function putCategory(c: Category) {
    categories.value.set(c.id, c)
    // if (s.id === currentFromLocalStorage) {
    //   space.value = s
    // }
  }

  // function setSpace(spaceId: string) {
  //   console.log("setting space to ", spaceId)
  //   space.value = null as unknown as Space
  //   const theSpace: Space | undefined = spaces.value.get(spaceId)
  //   if (theSpace) {
  //     space.value = theSpace
  //   }
  // }
  //
  // function deleteById(spaceId: string) {
  //   console.log("deleting space", spaceId)
  //   spaces.value.delete(spaceId)
  //   if (spaceId === currentFromLocalStorage) {
  //     console.log("setting current space to null")
  //     space.value = null as unknown as Space
  //   }
  //   storage.deleteSpace(spaceId)
  // }

  return {
    categories,
    putCategory,
    initialize
  }
})
