import {defineStore} from 'pinia';
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import _ from "lodash";
import {TreeNode} from "src/models/Tree";
import {Tab} from "src/models/Tab";
import {useAuthStore} from "stores/auth";


export enum SyncMode {
  ACTIVE= "ACTIVE",
  INACTIVE = "INACTIVE",
  PARTIAL = "PARTIAL"
}


function getSyncMode() {
  const auth = useAuthStore()
  if (auth.isAuthenticated && auth.user) {
    console.log("reading syncMode for user", auth.user['uid'])
    return localStorage.getItem(auth.user['uid'] + ".syncMode");
  }
  console.log("reading syncMode")
  return localStorage.getItem("syncMode");
}

export const useSyncStore = defineStore('sync', {
  state: () => ({
    // bookmarksTree: [] as unknown as object[]
    syncMode: SyncMode.INACTIVE
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
      console.log("got syncMode", syncMode)
      return isAuthenticated && (syncMode !== undefined && syncMode !== null)
    }
  },

  actions: {
    init() {
      const syncMode: string | null = getSyncMode()
      if (syncMode !== null) {
        this.syncMode = SyncMode[syncMode as keyof typeof SyncMode]
      }
    },
    setSyncMode(mode: SyncMode) {
      this.syncMode = mode
      const auth = useAuthStore()
      if (auth.isAuthenticated && auth.user) {
        console.log("setting syncMode for user", auth.user['uid'], mode)
        localStorage.setItem(auth.user['uid'] + ".syncMode",mode.toString());
      } else {
        console.log("setting syncMode", mode)
        localStorage.setItem("syncMode", mode.toString())
      }
    }

  }
});
