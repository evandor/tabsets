import _ from 'lodash'
import { defineStore } from 'pinia'
import { Notification } from 'src/core/models/Notification'
import { useUtils } from 'src/core/services/Utils'
import PersistenceService from 'src/services/PersistenceService'
import { ref } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  const info = ref('')
  const bookmarksExpanded = ref([] as unknown as string[])
  const updateToVersion = ref('')
  const notifications = ref([] as unknown as Notification[])

  const { inBexMode } = useUtils()

  /**
   * the (internal) storage for this store to use
   */
  //  let storage: PersistenceService = null as unknown as PersistenceService

  /**
   * initialize store with
   *
   * @param ps a notifications storage
   */
  async function initialize(ps: PersistenceService) {
    // console.debug(' ...initializing notifications')
    // storage = ps
    // const newNotifications = await storage.getNotifications(true)
    // notifications.value = newNotifications
  }

  function updateAvailable(available: boolean, version: string = '') {
    updateToVersion.value = available ? version : ''
    console.log('updateToVersion set to ', updateToVersion.value)
    if (available && inBexMode()) {
      //useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.RELEASE_NOTES_AVAILABLE))
    }
  }

  function getNotification(notificationId: string): Notification | undefined {
    const r: any[] = _.filter(notifications.value, (n: Notification) => n.id === notificationId)
    if (r && r.length > 0) {
      return r[0]
    }
    return undefined
  }

  return {
    initialize,
    info,
    notifications,
    getNotification,
    updateAvailable,
    bookmarksExpanded,
    updateToVersion,
  }
})
