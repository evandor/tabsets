import { defineStore } from 'pinia';
import firebase from "firebase/app";
import "firebase/auth";
import {firebaseAuth} from "boot/firebase";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: false,
    user: null
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
          const t = await currentUser.getIdToken(true)
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
    logout(): Promise<any> {
      return firebaseAuth.signOut()
        .then((success: any) => {
          console.log("logged out")
          this.user = null
          this.authenticated = false
        })
    }

  }
});
