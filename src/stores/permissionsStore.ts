import {defineStore} from 'pinia';
import {computed, ref, watch} from "vue";
import {useQuasar} from "quasar";


export const usePermissionsStore = defineStore('permissions', () => {

  const $q = useQuasar()

  // related to chrome permissions
  const grantedOptionalPermissions = ref<string[] | undefined>([])
  const grantedOptionalOrigins = ref<string[] | undefined>([])
  const permissions = ref<chrome.permissions.Permissions | undefined>(undefined)

  // related to tabsets permissions
  const activeFeatures = ref<string[]>($q.localStorage.getItem('ui.activeFeatures') as string[] || [])

  async function initialize() {
    console.debug("initializing permissions Store")
    // @ts-ignore
    permissions.value = await chrome.permissions.getAll()
    //console.log("permissions", permissions.value)
    if (permissions.value) {
      grantedOptionalPermissions.value = permissions.value.permissions ? permissions.value.permissions : []
      grantedOptionalOrigins.value = permissions.value.origins ? permissions.value.origins : []
      console.log("initializing permissions Store done")
    }
  }

  const hasPermission = computed(() => {
    return (permission: string): boolean | undefined => {
      //console.log("query for permission", permission, grantedOptionalPermissions.value.indexOf(permission) >= 0)
      return grantedOptionalPermissions.value ? grantedOptionalPermissions.value.indexOf(permission) >= 0 : undefined
    }
  })

  const hasAllOrigins = computed(() => {
    return (): boolean | undefined => {
      return grantedOptionalOrigins.value ?
        grantedOptionalOrigins.value.indexOf("*://*/*") >= 0
        : undefined
    }
  })

  async function grantPermission(permission: string): Promise<boolean> {
    // @ts-ignore
    const granted: boolean = await chrome.permissions.request({permissions: [permission]})
    return initialize()
      .then(() => Promise.resolve(granted))
  }

  async function grantAllOrigins(): Promise<boolean> {
    // @ts-ignore
    const granted: boolean = await chrome.permissions.request({origins: ["*://*/*", "<all_urls>"]})
    return initialize()
      .then(() => Promise.resolve(granted))
  }

  async function revokePermission(permission: string): Promise<void> {
    // @ts-ignore
    await chrome.permissions.remove({permissions: [permission]})
    await initialize()
    return Promise.resolve()
  }

  async function revokeAllOrigins(): Promise<void> {
    // @ts-ignore
    await chrome.permissions.remove({origins: ["*://*/*", "<all_urls>"]})
    await initialize()
    return Promise.resolve()
  }

  watch(activeFeatures.value, (val: any[]) => {
    $q.localStorage.set("ui.activeFeatures", val)
  })

  const hasFeature = computed(() => {
    return (feature: string): boolean => {
      return activeFeatures.value.indexOf(feature) >= 0
    }
  })

  const activateFeature = computed(() => {
    return (feature: string): void => {
      if (activeFeatures.value.indexOf(feature) < 0) {
        activeFeatures.value.push(feature)
      }
    }
  })

  const deactivateFeature = computed(() => {
    return (feature: string): void => {
      const index = activeFeatures.value.indexOf(feature)
      if (index >= 0) {
        activeFeatures.value.splice(index, 1)
      }
    }
  })

  return {
    initialize,
    hasPermission,
    grantPermission,
    revokePermission,
    hasAllOrigins,
    grantAllOrigins,
    revokeAllOrigins,
    permissions,
    hasFeature,
    activateFeature,
    deactivateFeature
  }
})
