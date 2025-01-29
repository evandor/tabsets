import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type AccessItem = 'TABS' | 'TABSETS' | 'SPACES' | 'SYNC' | 'SHARE' | 'FEATURE_TOGGLES'

/**
 * dummy store for submodules integration
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ uid: string; email: string }>({ uid: '', email: '' })

  // --- init ---
  async function initialize() {}

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

  const limitExceeded = computed(
    (): ((item: AccessItem, count: number) => { exceeded: boolean; limit: number | undefined }) => {
      return (item: AccessItem, count: number): { exceeded: boolean; limit: number | undefined } => {
        return { exceeded: false, limit: undefined }
      }
    },
  )

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
