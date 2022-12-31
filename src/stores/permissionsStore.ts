import {defineStore} from 'pinia';
import {computed, ref} from "vue";


export const usePermissionsStore = defineStore('permissions', () => {

  initialize()

  const grantedOptionalPermissions = ref<string[] | undefined>([])
  const grantedOptionalOrigins = ref<string[] | undefined>([])

  async function initialize() {
    console.log("initializing permissions Store")
    // @ts-ignore
    const permissions: chrome.permissions.Permissions = await chrome.permissions.getAll()
    console.log("permissions", permissions)
    grantedOptionalPermissions.value = permissions.permissions ? permissions.permissions : []
    grantedOptionalOrigins.value = permissions.origins ? permissions.origins : []
  }

  const hasPermission = computed(() => {
    return (permission: string): boolean | undefined => {
      //console.log("query for permission", permission, grantedOptionalPermissions.value.indexOf(permission) >= 0)
      return grantedOptionalPermissions.value ? grantedOptionalPermissions.value.indexOf(permission) >= 0 : undefined
    }
  })

  const hasOrigin = computed(() => {
    return (origin: string): boolean | undefined => {
      return grantedOptionalOrigins.value ? grantedOptionalOrigins.value.indexOf(origin) >= 0 : undefined
    }
  })

  async function grantPermission(permission: string): Promise<boolean> {
    // @ts-ignore
    const granted: boolean = await chrome.permissions.request({permissions: [permission]})
    return initialize()
      .then(() => Promise.resolve(granted))
  }

  async function grantOrigin(origin: string): Promise<boolean> {
    // @ts-ignore
    const granted: boolean = await chrome.permissions.request({origins: [origin]})
    return initialize()
      .then(() => Promise.resolve(granted))
  }

  async function revokePermission(permission: string): Promise<void> {
    // @ts-ignore
    await chrome.permissions.remove({permissions: [permission]})
    await initialize()
    return Promise.resolve()
  }

  async function revokeOrigin(origin: string): Promise<void> {
    // @ts-ignore
    await chrome.permissions.remove({origins: [origin]})
    await initialize()
    return Promise.resolve()
  }


  return {hasPermission, grantPermission, revokePermission, hasOrigin, grantOrigin, revokeOrigin}
})
