import {defineStore} from 'pinia';
import {Subscription} from "src/models/Subscription";
import {Auth0VueClient} from "@auth0/auth0-vue";
import {User} from "firebase/auth";
import {LocalStorage, useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import PersistenceService from "src/services/PersistenceService";
import {computed, ref} from "vue";
import {Account} from "src/models/Account";

export const useAuthStore = defineStore('auth', () => {

  let storage = null as unknown as PersistenceService

  const authenticated = ref(false)
  const user = ref<User>(null as unknown as User)
  const subscription = ref<Subscription>(null as unknown as Subscription)
  const idToken = ref<string>(null as unknown as string)
  const authRequest = ref<string>(null as unknown as string)

  // --- init ---
  function initialize(ps: PersistenceService) {
    storage = ps
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
    authRequest.value = null as unknown as string
    console.log("auth request was nulled")
    return val
  })

  // --- actions ---
  function setUser(u: User) {
    LocalStorage.set("current.user.id", u.uid)
    authenticated.value = true;
    user.value = u;
  }

  function setAuthRequest(ar: string) {
    console.log("setting auth request to", authRequest)
    authRequest.value = ar
  }

  function logout(): Promise<any> {
    authenticated.value = false
    user.value = null as unknown as User
    LocalStorage.remove("current.user.id")
    console.log("logout", (process.env.MODE === 'bex') ? window.location.origin + "/www/index.html" : window.location.origin)
    return Promise.resolve("")
  }

  function upsertAccount(account: Account) {
    storage.upsertAccount(account)
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
    upsertAccount
  }
})
