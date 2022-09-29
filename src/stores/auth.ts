import { defineStore } from 'pinia';
import firebase from "firebase/app";
import "firebase/auth";
import {firebaseAuth} from "boot/firebase";
import {Subscription} from "src/models/Subscription";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: false,
    user: null,
    subscription: null as unknown as Subscription
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
    async getToken(): Promise<string> {
      console.log("getting token")
      const currentUser = firebaseAuth.currentUser
      console.log("currentUser", currentUser)
      if (currentUser) {
        try {
          const t = await currentUser.getIdToken(  true)
          //this.token = t
          return t
        } catch (error) {
          console.error("error", error)
          return Promise.reject()
        }
      }
      return Promise.reject()
    }

  },

  actions: {
    setUser(user: any) {
      console.log("authStore: setting user", user)
      this.authenticated = true;
      this.user = user;
    },
    increment () {
      //this.counter++;
    },
    setSubscription (sub: object) {
      console.log("got sub", sub)
      this.subscription = new Subscription(sub['created' as keyof object] ,sub['account' as keyof object])
      console.log("setting subscription to ", this.subscription)
    },
    logout(): Promise<any> {
      // @ts-ignore
      return firebaseAuth.signOut()
        .then((success: any) => {
          console.log("logged out")
          this.user = null
          this.authenticated = false
        })
    }

  }
});
