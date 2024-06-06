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

export const useAuthStore = defineStore('auth', () => {

  let storage = null as unknown as PersistenceService

  const authenticated = ref(false)
  const user = ref<any>(null)
  const authRequest = ref<string>(null as unknown as string)
  const account = ref<Account | undefined>(undefined)

  const products = ref<string[]>([])


  // --- init ---
  async function initialize(ps: PersistenceService) {
    console.debug(" ...initializing AuthStore")
    storage = ps

    //check stored user info
    const userId = LocalStorage.getItem(CURRENT_USER_ID) as string
    if (userId) {
      try {
        console.log("getting account info for user", userId)
        const a: Account = await storage.getAccount(userId)
        account.value = a
      } catch (err) {
        console.warn("could not get account:", err)
      }
    }
  }

  // --- getters ---
  const isAuthenticated = computed(() => {
    return (): boolean => {
      return authenticated.value
    }
  })

  const getUsername = computed(() => {
    if (authenticated.value) {
      // @ts-ignore
      return user.value?.displayName || "undefined";
    }
    return "anonymous"
  })

  const getAccount = computed(() => {
    return (): Account | undefined => account.value
  })

  const getAccessTokenSilently = computed(async () => {
    if (process.env.MODE === 'electron') {
      // @ts-ignore
      const accessToken = await window.electronAPI.getAccessToken();
      return accessToken
    }
    return "await auth0.getAccessTokenSilently()"
  })

  const useAuthRequest = computed(() => {
    const val = authRequest.value
    // authRequest.value = null as unknown as string
    // console.log("auth request was nulled, was ", val)
    return val
  })

  const userMayAccess = computed(() => {
    return (item: AccessItem): boolean => {
      //console.log("checking access item", item)
      if (!user.value) {
        //console.log("result: no (no user)")
        return false
      }
      //console.log("checking against account", account.value)
      switch (item) {
        case AccessItem.SYNC:
          // return products.value.indexOf("prod_PLJipUG1Zfw7pC") >= 0
          return account.value ? account.value.products.indexOf("skysailSync") >= 0 : false
        case AccessItem.SHARE:
          return account.value !== undefined
        case AccessItem.FEATURE_TOGGLES:
          return true
        default:
          return false
      }
    }
  })

  // --- actions ---
  async function setUser(u: any | undefined) {
    console.log("noop: setting user id to ", u?.uid)
  }

  function setAuthRequest(ar: string) {
    console.log("setting auth request to", ar)
    authRequest.value = ar
  }

  function logout(): Promise<any> {
    return Promise.resolve("noop: logging out user")
  }

  function upsertAccount(acc: Account | undefined) {
    if (acc) {
      storage.upsertAccount(acc)
    }
    account.value = acc
  }

  function setProducts(ps: string[]) {
    products.value = ps
  }

  return {
    initialize,
    isAuthenticated,
    getUsername,
    getAccessTokenSilently,
    useAuthRequest,
    setAuthRequest,
    setUser,
    logout,
    user,
    upsertAccount,
    getAccount,
    setProducts,
    userMayAccess
  }
})
