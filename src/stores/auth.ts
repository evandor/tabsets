import {defineStore} from 'pinia';
import {Subscription} from "src/models/Subscription";
import {Auth0VueClient, User} from "@auth0/auth0-vue";
import {useRouter} from "vue-router";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: false, // dummy implementation
    user: {name: "unknown"},
    subscription: null as unknown as Subscription,
    idToken: null as unknown as string,
    authRequest: null as unknown as string
  }),

  getters: {
    isAuthenticated(): boolean {
      return this.authenticated;
    },
    getUsername(): string {
      if (this.authenticated) {
        // @ts-ignore
        return this.user?.displayName || "undefined";
      }
      return "anonymous"
    },
    async getAccessTokenSilently(): Promise<string> {
      if (process.env.MODE === 'electron') {
        // @ts-ignore
        const accessToken = await window.electronAPI.getAccessToken();
        //console.log("got accessToken", accessToken)
        return accessToken
      }
      return await this.auth0.getAccessTokenSilently()
    },
    useAuthRequest(): string | null {
      const val = this.authRequest
      this.authRequest = null as unknown as string
      console.log("auth request was nulled")
      return val
    }


  },

  actions: {
    setUser(user: User) {
      //console.log("authStore: setting user", typeof user, user.email, user.name)
      if (!user.name) {
        console.log("setting user without name", user)
        return
      }
      localStorage.setItem("current.user", user.name)
      // IndexedDbPersistenceService.init("db-" + user.name)
      //   .then(() => PouchDbPersistenceService.init("db-" + user.name))
      this.authenticated = true;
      this.user = user;
    },
    setAuth0(auth0: Auth0VueClient) {
      //console.log("authStore: setting auth0", typeof auth0, auth0)
      // @ts-ignore
      this.auth0 = auth0
    },
    increment() {
      //this.counter++;
    },
    setSubscription(sub: object) {
    },

    async getToken(api: any): Promise<string> {
      return Promise.resolve("")
    },

    setAuthRequest(authRequest: string) {
      console.log("setting auth request to", authRequest)
      this.authRequest = authRequest
    },

    logout(): Promise<any> {
      this.authenticated = false
      this.user = undefined
      console.log("logout", (process.env.MODE === 'bex') ? window.location.origin + "/www/index.html" : window.location.origin)
      return Promise.resolve("")
    }

  }
});
