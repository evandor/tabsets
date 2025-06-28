import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePermissionsStore = defineStore('permissions', () => {
  // related to chrome permissions
  const grantedOptionalPermissions = ref<string[] | undefined>([])
  const grantedOptionalOrigins = ref<string[] | undefined>([])
  const permissions = ref<chrome.permissions.Permissions | undefined>(undefined)

  async function initialize() {
    // console.debug(' ...initializing permissionsStore', '✅')
    await load()
  }

  async function load() {
    if (process.env.MODE !== 'bex') {
      return
    }
    if (chrome) {
      // issues in vitest where chrome is not defined
      permissions.value = await chrome.permissions.getAll()
      if (permissions.value) {
        grantedOptionalPermissions.value = permissions.value.permissions ? permissions.value.permissions : []
        grantedOptionalOrigins.value = permissions.value.origins ? permissions.value.origins : []
      }
    }
  }

  async function grantPermission(permission: string): Promise<boolean> {
    console.log('about to grant permission', permission)
    const granted: boolean = await chrome.permissions.request({ permissions: [permission] })
    console.log('permission granted: ', granted)
    return load().then(() => Promise.resolve(granted))
  }

  async function revokePermission(permission: string): Promise<void> {
    await chrome.permissions.remove({ permissions: [permission] })
    await load()
    return Promise.resolve()
  }

  return {
    initialize,
    load,
    grantPermission,
    revokePermission,
    permissions,
  }
})
