import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSearchStore } from 'src/search/stores/searchStore'
import { beforeEach, describe, expect, it } from 'vitest'

installQuasarPlugin()

describe('SearchStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await useSearchStore().init()
  })

  it('passing empty object to addObjectToIndex throws error', async () => {
    expect(() => useSearchStore().addObjectToIndex({})).toThrowError(/does not have an URL/)
  })

  it('passing minimal object to addObjectToIndex succeeds', async () => {
    useSearchStore().addObjectToIndex({ url: 'some-pseudo-url' })
  })

  it('a valid object added with addObjectToIndex can be found in search', async () => {
    useSearchStore().addObjectToIndex({ url: 'https://www.skysail.io', name: 'name', title: 'foo' })

    const searchResult = useSearchStore().search('foo')

    expect(searchResult.length).toBe(1)
    expect(searchResult[0]!.item['name']).toBe('name')
    expect(searchResult[0]!.item['title']).toBe('foo')
  })

  it('second document with same url updates existing one', async () => {
    useSearchStore().addObjectToIndex({ url: 'https://www.skysail.io', name: 'name', title: 'foo' })
    useSearchStore().addObjectToIndex({
      url: 'https://www.skysail.io',
      name: 'name2',
      title: 'foo2',
    })
    const searchResult = useSearchStore().search('foo')
    //console.log("searchResult", searchResult[0].matches)
    expect(searchResult.length).toBe(1)
    expect(searchResult[0]!.item['title']).toBe('foo2')
  })

  it('searching finds the proper document', async () => {
    useSearchStore().addObjectToIndex({ url: 'https://www.skysail.io', name: 'name', title: 'foo' })
    useSearchStore().addObjectToIndex({
      url: 'https://www.heise.de',
      name: 'heise',
      title: 'homepage',
    })

    const searchResult = useSearchStore().search('heise')

    expect(searchResult.length).toBe(1)
    expect(searchResult[0]!.item['name']).toBe('heise')
    expect(searchResult[0]!.item['title']).toBe('homepage')
  })

  it('upserting updates existing document', async () => {
    useSearchStore().addObjectToIndex({
      url: 'https://www.skysail.io',
      name: 'name',
      title: 'fooOld',
    })

    useSearchStore().upsertObject({ url: 'https://www.skysail.io', name: 'name', title: 'fooNew' })

    const searchResultFooOld = useSearchStore().search('fooOld')
    expect(searchResultFooOld.length).toBe(0)
    const searchResult = useSearchStore().search('fooNew')
    expect(searchResult.length).toBe(1)
    expect(searchResult[0]!.item['title']).toBe('fooNew')
  })

  it('upserting creates new document for new url', async () => {
    useSearchStore().addObjectToIndex({
      url: 'https://www.skysail.io',
      name: 'name',
      title: 'fooOld',
    })

    useSearchStore().upsertObject({
      url: 'https://www.heise.de',
      name: 'heise',
      title: 'heisetitle',
    })

    const searchResultFooOld = useSearchStore().search('fooOld')
    expect(searchResultFooOld.length).toBe(1)
    const searchResult = useSearchStore().search('heisetitle')
    expect(searchResult.length).toBe(1)
  })
})
