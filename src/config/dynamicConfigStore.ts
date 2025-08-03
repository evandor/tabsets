import * as O from 'fp-ts/lib/Option'
import { defineStore } from 'pinia'
import { TabCategory } from 'src/tabsets/models/Tab'
import { computed, ref } from 'vue'

export const useDynamicConfig = defineStore('dynamicConfig', () => {
  const categoryMapping = ref<Map<string, Map<string, TabCategory>>>(new Map())

  fetch('https://raw.githubusercontent.com/evandor/tabsets/refs/heads/main/config/categoryMapping.data').then((res) => {
    res.text().then((body: string) => {
      //console.log('res', body)
      const lines = body.split('\n')
      try {
        lines.forEach((line: string) => {
          const parts = line.split(';')
          if (line.trim().length === 0) {
            return
          }
          if (parts.length !== 3) {
            console.warn(`found wrong line for categoryMapping: '${line}'`)
            return
          }
          const type = parts[0]!
          const key = parts[1]!
          const cat = parts[2]!
          if (!categoryMapping.value.has(type)) {
            categoryMapping.value.set(type, new Map())
          }
          categoryMapping.value.get(type)!.set(key, cat as TabCategory)
        })
        console.log(`categoryMapping from input (${lines.length} lines)`)
      } catch (e) {
        console.log('could not read categoryMapping.data')
      }
    })
  })

  const init = () => {
    // triggers data fetching
  }

  const getCategory = computed(() => {
    return (type: string, keys: string[]): O.Option<TabCategory> => {
      //console.log(`searching category for ${type}/${keys.join(',')}`)
      const typeMapping = categoryMapping.value.get(type)
      if (typeMapping) {
        for (const key of keys) {
          if (key && key.trim().length > 0 && typeMapping.has(key.toLowerCase())) {
            return O.of(typeMapping.get(key.toLowerCase())!)
          }
        }
      }
      return O.none
    }
  })

  return {
    getCategory,
    init,
  }
})
