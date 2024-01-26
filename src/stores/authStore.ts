import {defineStore} from 'pinia';
import {Subscription} from "src/models/Subscription";
import {Auth0VueClient} from "@auth0/auth0-vue";
import {getAuth, signOut, User} from "firebase/auth";
import {LocalStorage, useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import PersistenceService from "src/services/PersistenceService";
import {computed, ref} from "vue";
import {Account} from "src/models/Account";
import {CURRENT_USER_ID} from "boot/constants";

export enum AccessItem {
  SYNC="SYNC",
  SHARE="SHARE",
  FEATURE_TOGGLES="FEATURE_TOGGLES"
}

export const useAuthStore = defineStore('auth', () => {

  let storage = null as unknown as PersistenceService

  const authenticated = ref(false)
  const user = ref<User>(null as unknown as User)
  const subscription = ref<Subscription>(null as unknown as Subscription)
  const idToken = ref<string>(null as unknown as string)
  const authRequest = ref<string>(null as unknown as string)
  const account = ref<Account | undefined>(undefined)

  const products = ref<string[]>([])


  // --- init ---
  function initialize(ps: PersistenceService) {
    storage = ps

    // check stored user info
    // const userId = LocalStorage.getItem(CURRENT_USER_ID)
    // if (userId) {
    //   console.log("getting account info for user", userId)
    //   storage.getAccount(userId)
    //     .then(a => account.value = a)
    //     .catch((err) => {
    //       console.warn("could not get account:", err)
    //     })
    // }
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
      //console.log("got accessToken", accessToken)
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
        console.log("result: no (no user)")
        return false
      }
      //console.log("checking against products", products.value)
      switch (item) {
        case AccessItem.SYNC:
          return products.value.indexOf("prod_PLJipUG1Zfw7pC") >= 0
        case AccessItem.FEATURE_TOGGLES:
          return true
        default: return false
      }
    }
  })

  // --- actions ---
  function setUser(u: User | undefined) {
    if (u) {
      LocalStorage.set(CURRENT_USER_ID, u.uid)
      authenticated.value = true;
      user.value = u;
    } else {
      LocalStorage.remove(CURRENT_USER_ID)
      authenticated.value = false;
      user.value = null as unknown as User;
      products.value = []
    }
  }

  function setAuthRequest(ar: string) {
    console.log("setting auth request to", ar)
    authRequest.value = ar
  }

  function logout(): Promise<any> {
    console.log("logging out user")
    return signOut(getAuth())
      .then(() => {
        authenticated.value = false
        user.value = null as unknown as User
        LocalStorage.remove(CURRENT_USER_ID)
        //console.log("logout", (process.env.MODE === 'bex') ? window.location.origin + "/www/index.html" : window.location.origin)
        return Promise.resolve("")
      })
  }

  function upsertAccount(account: Account) {
    storage.upsertAccount(account)
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
