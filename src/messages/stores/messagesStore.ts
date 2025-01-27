import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * messages are displayed to the user to inform her about things happening.
 */
export const useMessagesStore = defineStore('messages', () => {
  const lastUpdate = ref<number>(new Date().getTime())

  function initialize() {
    // console.debug(` ...initializing messagesStore`)
    setUpSnapshotListener()
  }

  function setUpSnapshotListener() {}

  const getUnreadMessages = computed(() => {})

  return {
    initialize,
    lastUpdate,
    getUnreadMessages,
  }
})
