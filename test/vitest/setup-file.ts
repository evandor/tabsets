// // This file will be run before each test file
import { INDEX_DB_VERSION } from 'src/boot/constants'
import { useJestHelper } from 'src/domain/JestHelper'
import 'fake-indexeddb/auto'
import { config } from '@vue/test-utils'

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
