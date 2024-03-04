import {installQuasarPlugin} from '@quasar/quasar-app-extension-testing-unit-vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createPinia, setActivePinia, StoreDefinition} from "pinia";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useDB} from "src/services/usePersistenceService";
import PersistenceService from "src/services/PersistenceService";
import {useBookmarksStore} from "stores/bookmarksStore";
import ChromeApi from "src/services/ChromeApi";
import {TreeNode} from "src/models/Tree";

installQuasarPlugin();

vi.mock('vue-router')

async function setupMocks(bms:  chrome.bookmarks.BookmarkTreeNode[]) {
  //console.log("setupMocks with current windows", currentWindows)
  // https://groups.google.com/a/chromium.org/g/chromium-extensions/c/hssoAlvluW8
  const chromeMock = {
    bookmarks: {
      search: vi.fn((options, callback) => {
        return Promise.resolve(bms)
      }),
      getTree: vi.fn((options, callback) => {
        return Promise.resolve(bms)
      })
    },
    runtime: {
      sendMessage: vi.fn(() => {
      })
    }
  };

  vi.stubGlobal('chrome', chromeMock);

  vi.mock('src/stores/permissionsStore', () => ({
    usePermissionsStore: () => ({
      hasPermission: vi.fn((ident: string) => true),
      hasFeature: vi.fn((ident: string) => true),
    }),
  }))


}

async function setupStores() {
  await useBookmarksStore().init()
  await useBookmarksStore().loadBookmarks()
}

describe('BookmarksStore', () => {

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    await IndexedDbPersistenceService.init("db")
  })


  it('initializing correctly for empty bookmarks', async () => {

    const folderA = ChromeApi.createChromeBookmarkTreeNodeObject("folderA", "")
    const rootFolder = ChromeApi.createChromeBookmarkTreeNodeObject("root", "", [folderA])

    await setupMocks([rootFolder])
    await setupStores()

    const nonLeafNodes = useBookmarksStore().nonLeafNodes
    const bmNodes = useBookmarksStore().bookmarksNodes2 as TreeNode[]
    console.log("bmNodes", bmNodes)
    expect(bmNodes.length).toBe(1)
    expect(bmNodes[0].header).toBe('node')
    expect(bmNodes[0].id.length).toBe(36)
    expect(bmNodes[0].url).toBe('')
    expect(bmNodes[0].children.length).toBe(0)
    expect(bmNodes[0].subFoldersCount).toBe(0)
    expect(bmNodes[0].subNodesCount).toBe(0)
    expect(useBookmarksStore().bmsCount).toBe(0)
    // expect(useBookmarksStore().foldersCount).toBe(1)
  })


});
