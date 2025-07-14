import { STRIP_CHARS_IN_USER_INPUT } from 'boot/constants'
import { uid } from 'quasar'
import { useNavigationService } from 'src/core/services/NavigationService'
import { Space } from 'src/spaces/models/Space'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useAuthStore } from 'stores/authStore'

export function useSpacesService() {
  /**
   * create a new space; checks if label already exists and checks limits.
   *
   * Creates Space object and delegates to store.
   *
   * @param label
   */
  async function addSpace(label: string): Promise<Space> {
    const spacesStore = useSpacesStore()
    const exceedInfo = useAuthStore().limitExceeded('SPACES', spacesStore.spaces.size)
    if (exceedInfo.exceeded) {
      return await handleLimitExceeded(exceedInfo)
    }

    const useLabel = label.replace(STRIP_CHARS_IN_USER_INPUT, '').substring(0, 31)
    const spaceId = uid()

    console.log('adding space', spaceId, useLabel)
    if (spacesStore.nameExists(useLabel)) {
      return Promise.reject(`name '${useLabel}'does already exist`)
    }
    const newSpace = new Space(spaceId, useLabel)
    spacesStore.spaces.set(spaceId, newSpace)
    await spacesStore.addSpace(newSpace)
    console.log('spaces store size', spacesStore.storeSize)
    return Promise.resolve(newSpace)
  }

  async function handleLimitExceeded(exceedInfo: {
    exceeded: boolean
    limit: number | undefined
    quota: number | undefined
  }) {
    await useNavigationService().browserTabFor(
      chrome.runtime.getURL(
        `/www/index.html#/mainpanel/settings?tab=account&exceeded=spaces&limit=${exceedInfo.limit}`,
      ),
    )
    return Promise.reject('tabsetLimitExceeded')
  }

  return {
    addSpace,
  }
}
