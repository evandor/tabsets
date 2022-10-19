import {defineStore} from 'pinia';
import {useAuthStore} from "src/stores/auth";
import {SyncMode} from "src/models/Subscription";


export enum Subscription {
  UNKNOWN = "UNKNOWN",
  FREE="FREE",
  PRO= "PRO"
}


function getSyncMode(): SyncMode {
  const auth = useAuthStore()
  if (auth.isAuthenticated && auth.user) {
    return auth.subscription.syncMode || SyncMode.UNKNOWN
  }
  return SyncMode.UNKNOWN
}

export const useSyncStore = defineStore('sync', {
  state: () => ({
    // bookmarksTree: [] as unknown as object[]
    //syncMode: SyncMode.INACTIVE,

    // "pro" user?
    subscription: Subscription.UNKNOWN
  }),

  getters: {
    showSyncButton(state): boolean {
      const isAuthenticated = useAuthStore().isAuthenticated
      const syncMode = getSyncMode()
      return isAuthenticated && (syncMode === undefined || syncMode === null)
    },
    showSyncMode(state): boolean {
      const isAuthenticated = useAuthStore().isAuthenticated
      const syncMode = getSyncMode()
      //console.log("got syncMode", syncMode)
      return isAuthenticated && (syncMode !== undefined && syncMode !== null)
    }
  },

  actions: {
    init() {
      const syncMode: string | null = getSyncMode()
      if (syncMode !== null) {
        //console.log("got syncMode", syncMode)
        //this.syncMode = SyncMode[syncMode as keyof typeof SyncMode]
        //console.log("this.syncMode", this.syncMode)
      }
    }

  }
});
