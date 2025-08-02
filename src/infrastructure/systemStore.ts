import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSpacesStore = defineStore('system', () => {
  const memory = ref<chrome.system.memory.MemoryInfo | undefined>(undefined)

  setInterval(
    () => () => {
      chrome.system.memory.getInfo().then((info: chrome.system.memory.MemoryInfo) => {
        memory.value = info
        console.log('memory', info)
      })
    },
    10000,
  )
  return {
    memory,
  }
})
