import * as O from 'fp-ts/lib/Option'
import { defineStore } from 'pinia'
import { ContentClassification } from 'src/tabsets/models/types/ContentClassification'
import { computed, ref } from 'vue'

function handleCategoryMapping(line: string, categoryMapping: Map<string, Map<string, ContentClassification>>) {
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
  if (!categoryMapping.has(type)) {
    categoryMapping.set(type, new Map())
  }
  categoryMapping.get(type)!.set(key, cat as ContentClassification)
}

function handleLdJsonMapping(line: string, ldJsonMapping: Map<string, Map<string, Map<string, any>>>) {
  const parts = line.split(';')
  if (line.trim().length === 0) {
    return
  }
  if (parts.length !== 5) {
    console.warn(`found wrong line for ldJsonMapping: '${line}'`)
    return
  }
  // https://schema.org;LocalBusiness;$.longitude;number;place.longitude
  const schema = parts[0]!
  const type = parts[1]!
  const jsonPath = parts[2]!
  const dataType = parts[3]!
  const data = parts[4]!

  if (!ldJsonMapping.has(schema)) {
    ldJsonMapping.set(schema, new Map())
  }
  const theSchema = ldJsonMapping.get(schema)!

  if (!theSchema.has(type)) {
    theSchema.set(type, new Map())
  }
  const theType = theSchema.get(type)!

  if (!theType.has(jsonPath)) {
    theType.set(jsonPath, new Map())
  }
  const theDataType = theType.get(jsonPath)!
  // if (!theDataType.has(dataType)) {
  //   theDataType.set(dataType, new Map())
  // }

  theDataType.set(dataType, data)
}

export const useDynamicConfig = defineStore('dynamicConfig', () => {
  const categoryMapping = ref<Map<string, Map<string, ContentClassification>>>(new Map())
  const lDJsonMapping = ref<Map<string, Map<string, Map<string, any>>>>(new Map())

  fetch('https://raw.githubusercontent.com/evandor/tabsets/refs/heads/main/config/categoryMapping.data').then((res) => {
    res.text().then((body: string) => {
      const lines = body.split('\n')
      try {
        lines.forEach((line: string) => {
          handleCategoryMapping(line, categoryMapping.value)
        })
        console.log(
          ` config: categoryMapping from input (${lines.length} lines) with rootSize`,
          categoryMapping.value.size,
        )
      } catch (e) {
        console.log(' config: could not read categoryMapping.data', e)
      }
    })
  })

  fetch('https://raw.githubusercontent.com/evandor/tabsets/refs/heads/main/config/ldJsonMapping.data').then((res) => {
    res.text().then((body: string) => {
      //console.log('res', body)
      const lines = body.split('\n')
      try {
        lines.forEach((line: string) => {
          handleLdJsonMapping(line, lDJsonMapping.value)
        })
        console.log(` config: lDJsonMapping from input (${lines.length} lines) with rootSize`, lDJsonMapping.value.size)
      } catch (e) {
        console.log(' config: could not read lDJsonMapping.data', e)
      }
    })
  })

  const init = () => {
    // triggers data fetching
  }

  const getCategory = computed(() => {
    return (type: string, keys: string[]): O.Option<ContentClassification> => {
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

  const getLinkedDataDefinition = computed(() => {
    return (schema: string, type: string): Map<string, Map<string, any>> => {
      const theSchema: Map<string, Map<string, Map<string, any>>> = lDJsonMapping.value.get(schema) || new Map()
      if (theSchema) {
        const theType: Map<string, Map<string, any>> = theSchema.get(type) || new Map()
        if (theType) {
          return theType
        }
      }
      return new Map()
    }
  })

  return {
    getCategory,
    getLinkedDataDefinition,
    init,
  }
})
