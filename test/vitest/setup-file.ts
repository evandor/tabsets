// This file will be run before each test file
import {INDEX_DB_VERSION} from "boot/constants";
import {useJestHelper} from "src/domain/JestHelper";
import "fake-indexeddb/auto"
import {beforeAll} from "vitest/index";

const request = indexedDB.open('db', INDEX_DB_VERSION);
request.onupgradeneeded = async function () {
  await useJestHelper().dbInit(request)
}
process.env.MODE = "bex"

//beforeAll(() => {
  // https://vitest.dev/guide/browser.html
  // @ts-ignore - needed as 'chrome' is undefined in vitest
  global.chrome = undefined
  // global.browser = browser
//r})
