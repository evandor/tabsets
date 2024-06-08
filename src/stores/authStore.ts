import {defineStore} from 'pinia';
import {LocalStorage, useQuasar} from "quasar";
import PersistenceService from "src/services/PersistenceService";
import {computed, ref} from "vue";
import {Account, UserData} from "src/models/Account";
import {CURRENT_USER_ID} from "boot/constants";

export enum AccessItem {
  SYNC = "SYNC",
  SHARE = "SHARE",
  FEATURE_TOGGLES = "FEATURE_TOGGLES"
}

/**
 * dummy store for submodules integration
 */
export const useAuthStore = defineStore('auth', () => {

  // let storage = null as unknown as PersistenceService
  //
  // const authenticated = ref(false)
  const user = ref<any>(null)
  // const authRequest = ref<string>(null as unknown as string)
  // const account = ref<Account | undefined>(undefined)
  //
  // const products = ref<string[]>([])


  // --- init ---
  async function initialize(ps: PersistenceService) {
  }

  // --- getters ---
  const isAuthenticated = computed(() => {
    return false
  })

  const getUsername = computed(() => {
    return "anonymous"
  })

  const getAccount = computed(() => {
    return (): Account | undefined => undefined
  })

  // --- actions ---
  async function setUser(u: any | undefined) {
    console.log("noop: setting user id to ", u?.uid)
  }

  return {
    initialize,
    user,
    isAuthenticated,
    getUsername,
    setUser,
    getAccount,
  }
})
