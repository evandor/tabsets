// // This file will be run before each test file
import { INDEX_DB_VERSION } from 'src/boot/constants'
import { useJestHelper } from 'src/core/domain/JestHelper'
import 'fake-indexeddb/auto'
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

console.log('using setup-file.ts!')
const request = indexedDB.open('db', INDEX_DB_VERSION)
request.onupgradeneeded = async function () {
  await useJestHelper().dbInit(request)
}
process.env.MODE = 'bex'

// @ts-expect-error TODO - needed as 'chrome' is undefined in vitest
global.chrome = undefined

global.CSS = {
  // @ts-expect-error TODO
  supports: (k, v) => false,
}

config.global.mocks = {
  $t: (tKey: string) => tKey, // just return translation key
}

// https://stevekinney.com/courses/testing/mocking-fetch-and-network-requests due to useMetrics calls
// @ts-expect-error xxx
// global.fetch = vi.fn(() =>
//   Promise.resolve({
//     ok: true,
//     status: 200,
//     text: async () => '',
//     json: async () => ({}),
//     headers: new Headers(),
//   }),
// )

global.fetch = vi.fn(async (input: URL) => {
  const url = input.toString()
  if (url.endsWith('categoryMapping.data')) {
    const data = `linkingData;foodestablishment;restaurant
linkingData;newsarticle;news
linkingData;newsmediaorganization;news
linkingData;news;news
linkingData;product;shopping
linkingData;recipe;recipe
linkingData;restaurant;restaurant
openGraph;article;news
langModel;nachrichten;news
langModel;news;news
langModel;rezept;recipe
langModel;rezepte;recipe
langModel;restaurant;restaurant
`
    return Promise.resolve({
      ok: true,
      status: 200,
      text: async () => data,
    })
  }
  if (url.endsWith('ldJsonMapping.data')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      text: async () => 'https://schema.org;LocalBusiness;$.longitude;number;place.longitude\n',
    })
  }
  return Promise.resolve({ ok: false, status: 404, text: async () => '' })
})
