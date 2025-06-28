import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * this request store is meant to track transient state of the currently opened tab's request.
 *
 */
export const useRequestsStore = defineStore('requests', () => {
  const currentTabRequest = ref<chrome.webRequest.WebResponseHeadersDetails | undefined>(undefined)

  const setCurrentTabRequest = (details: chrome.webRequest.WebResponseHeadersDetails) => {
    //console.log('details', details)
    currentTabRequest.value = details
  }

  const getCurrentTabRequest = computed((): chrome.webRequest.WebResponseHeadersDetails | undefined => {
    return currentTabRequest.value
  })

  return {
    setCurrentTabRequest,
    getCurrentTabRequest,
  }
})
