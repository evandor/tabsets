import { defineStore } from 'pinia'
import PersistenceService from 'src/services/PersistenceService'
import { computed, ref } from 'vue'

export enum AccessItem {
  TABSETS = 'TABSETS',
  SYNC = 'SYNC',
  SHARE = 'SHARE',
  FEATURE_TOGGLES = 'FEATURE_TOGGLES',
}

/**
 * dummy store for submodules integration
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)

  // --- init ---
  async function initialize(ps: PersistenceService) {}

  // --- getters ---
  const isAuthenticated = computed(() => {
    return false
  })

  const getUsername = computed(() => {
    return 'anonymous'
  })

  const getAccount = computed(() => {
    return (): undefined => undefined
  })

  // --- actions ---
  async function setUser(u: any | undefined) {
    console.log('noop: setting user id to ', u?.uid)
  }

  const limitExceeded = computed(() => {
    return (item: AccessItem, count: number): boolean => {
      return false
    }
  })

  return {
    initialize,
    user,
    isAuthenticated,
    getUsername,
    setUser,
    getAccount,
    limitExceeded,
  }
})
