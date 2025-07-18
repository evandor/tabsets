import { defineStore } from 'pinia'
import { Account } from 'src/core/models/Account'
import { computed, ref } from 'vue'

export type AccessItem = 'TABS' | 'TABSETS' | 'SPACES' | 'SYNC' | 'SHARE' | 'FEATURE_TOGGLES' | 'THUMBNAILS'

/**
 * dummy store for submodules integration
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ uid: string; email: string; photoURL: string; isAnonymous: boolean }>({
    uid: '',
    email: '',
    photoURL: '',
    isAnonymous: false,
  })
  const products = ref<string[]>([])
  const avatar = ref('https://www.gravatar.com/avatar/unknown')

  // --- init ---
  async function initialize() {}

  // --- getters ---
  const isAuthenticated = computed(() => {
    return (): boolean => {
      return false
    }
  })

  const getUsername = computed(() => {
    return 'anonymous'
  })

  const getAccount = computed(() => {
    return (): Account | undefined => undefined
  })

  // --- actions ---
  async function setUser(u: any | undefined) {
    console.log('noop: setting user id to ', u?.uid)
  }

  const getUserData = computed(() => {
    return (): { thumbnails: number } => {
      return { thumbnails: 0 }
    }
  })

  const limitExceeded = computed(
    (): ((
      item: AccessItem,
      count: number,
    ) => { exceeded: boolean; limit: number | undefined; quota: number | undefined }) => {
      return (
        item: AccessItem,
        count: number,
      ): { exceeded: boolean; limit: number | undefined; quota: number | undefined } => {
        return { exceeded: false, limit: undefined, quota: undefined }
      }
    },
  )

  function logout(): Promise<any> {
    return Promise.resolve()
  }

  return {
    initialize,
    user,
    isAuthenticated,
    getUsername,
    setUser,
    logout,
    getAccount,
    getUserData,
    limitExceeded,
    avatar,
  }
})
