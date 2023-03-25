import {defineStore} from 'pinia';
import "firebase/auth";
import {Subscription} from "src/models/Subscription";
import {Auth0VueClient, useAuth0} from "@auth0/auth0-vue";
import {getAuth, signInWithCustomToken} from "firebase/auth";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: false,
    user: null,
    auth0: null as unknown as Auth0VueClient,
    subscription: null as unknown as Subscription,
    idToken: null as unknown as string
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

  },

  actions: {
    setUser(user: any) {
      console.log("authStore: setting user", typeof user, user)
      this.authenticated = true;
      this.user = user;
    },
    setAuth0(auth0: Auth0VueClient) {
      console.log("authStore: setting auth0", typeof auth0, auth0)
      // @ts-ignore
      this.auth0 = auth0
    },
    increment() {
      //this.counter++;
    },
    setSubscription(sub: object) {
      console.log("got sub", sub)
      this.subscription = new Subscription(sub['created' as keyof object], sub['account' as keyof object])
      console.log("setting subscription to ", this.subscription)
    },

    async getToken(api: any): Promise<string> {
      if (this.idToken !== null) {
        // if (Math.random() < 0.1) {
        //   console.log("invalid token !!!")
        //   return "invalid token - what happens?"
        // }
        return this.idToken
      }
      const token = await this.auth0.getAccessTokenSilently()
      const firebaseToken = await api.get(`${process.env.BACKEND_URL}/firebase`, {
        headers: {'Authorization': `Bearer ${token}`}
      })
      return signInWithCustomToken(getAuth(), firebaseToken.data['firebaseToken'])
        .then((answer: any) => {
          const result: string = answer['_tokenResponse']['idToken']
          this.idToken = result
          return result
        })
    },

    logout(): Promise<any> {
      console.log("logout")

      this.auth0.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      }).then((res:any) => {
        console.log("logout res", res)
      })

      // needed?
      // @ts-ignore
      return firebaseAuth.signOut()
        .then((success: any) => {
          console.log("firebaseAuth logged out")
          this.user = null
          this.authenticated = false
        })
    }

  }
});
