import {defineStore} from 'pinia';
import {Subscription} from "src/models/Subscription";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: true, // dummy imple
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
    increment() {
      //this.counter++;
    },
    setSubscription(sub: object) {
    },

    async getToken(api: any): Promise<string> {
      return Promise.resolve("")
    },

    logout(): Promise<any> {
      console.log("logout", (process.env.MODE === 'bex') ? window.location.origin + "/www/index.html" : window.location.origin)
      return Promise.resolve("")
    }

  }
});
