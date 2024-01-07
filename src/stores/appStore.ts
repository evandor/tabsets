import {defineStore} from 'pinia';
import {ref} from "vue";
import {LocalStorage, uid, useQuasar} from "quasar";
import {SHARING_INSTALLATION} from "boot/constants";

export enum SyncType {
  NONE = "NONE",
  GITHUB = "GITHUB",
  GITLAB = "GITLAB",
  COUCHDB = "COUCHDB",
  MANAGED_GIT = "MANAGED_GIT",
  MANAGED_COUCHDB = "MANAGED_COUCHDB"
}

export const useAppStore = defineStore('app', () => {

  const installationId = ref<string | undefined>(LocalStorage.getItem(SHARING_INSTALLATION) as string || undefined)

  function init() {
    // make sure we have an installation id
    getInstallationId()
  }

  function getInstallationId() {
    if (installationId.value) {
      return installationId.value
    }
    const useId = uid()
    installationId.value = useId
    LocalStorage.set(SHARING_INSTALLATION, useId)
    return useId
  }

  return {
    init,
    getInstallationId
  }
})
