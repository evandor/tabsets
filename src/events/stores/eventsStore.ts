import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * events are triggered 'in the background', and should be used to update the applications state.
 */
export const useEventsStore = defineStore('events', () => {
  const lastUpdate = ref<number>(new Date().getTime())

  //const events = ref<Event[]>([])

  function initialize() {}

  return {
    initialize,
    lastUpdate,
    //getUnreadMessages,
  }
})
