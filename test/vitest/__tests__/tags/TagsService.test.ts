import { createPinia, setActivePinia } from 'pinia'
import { useTagsService } from 'src/tags/TagsService'
import { beforeEach, describe, it } from 'vitest'

describe('notify example', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())

    // LocalStorage.remove('selectedTabset')
    // LocalStorage.remove('selectedTabsets')
  })
  it('minimal url example', async () => {
    const result = await useTagsService().analyse('theTitle', {}, undefined, [], 'https://www.skysail.io')
    console.log(result)
  })
})
