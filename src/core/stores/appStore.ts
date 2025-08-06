import { defineStore } from 'pinia'
import { LocalStorage, uid } from 'quasar'
import { APP_INSTALLATION_ID } from 'src/boot/constants'
import { useUtils } from 'src/core/services/Utils'
import { ref } from 'vue'

const { inBexMode } = useUtils()

export const useAppStore = defineStore('app', () => {
  const installationId = ref<string | undefined>((LocalStorage.getItem(APP_INSTALLATION_ID) as string) || undefined)

  const logflowId = ref<string>((Math.random() * 10).toString(36).replace('.', ''))

  function init() {
    // make sure we have an installation id
    getInstallationId()
  }

  function getInstallationId() {
    if (inBexMode() && installationId.value) {
      chrome.storage.local.set({ 'tabsets.ext.app.id': installationId.value })
      return installationId.value
    }
    const useId = uid()
    installationId.value = useId
    LocalStorage.set(APP_INSTALLATION_ID, useId)

    return useId
  }

  return {
    init,
    logflowId,
    getInstallationId,
  }
})
