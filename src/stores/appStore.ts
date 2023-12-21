import {defineStore} from 'pinia';
import {ref} from "vue";
import {LocalStorage, uid, useQuasar} from "quasar";

export enum SyncType {
  NONE = "NONE",
  GIT = "GIT"
}

export const useAppStore = defineStore('app', () => {

  const key = 'sharing.installation';

  const installationId = ref<string | undefined>(LocalStorage.getItem(key) as string || undefined)

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
    LocalStorage.set(key, useId)
    return useId
  }

  return {
    init,
    getInstallationId
  }
})
