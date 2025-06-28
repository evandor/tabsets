import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * this request store is meant to track transient state of the currently tabs.
 *
 */
export const useOpenTabsStore = defineStore('opentabs', () => {
  const openTabsMap = ref<Map<number, { index: number; url: string }>>(new Map())

  const setTabsMap = (map: Map<number, { index: number; url: string }>) => {
    openTabsMap.value = map
  }

  const getTabsMap = computed((): Map<number, { index: number; url: string }> => {
    return openTabsMap.value
  })

  return {
    setTabsMap,
    getTabsMap,
  }
})
