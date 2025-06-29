import { useBookmarksStore } from 'src/bookmarks/stores/bookmarksStore'
import { useUtils } from 'src/core/services/Utils'

const { inBexMode } = useUtils()

class BookmarksService {
  async init() {
    // console.debug(' ...initializing BookmarksService', '✅')
    if (inBexMode()) {
      useBookmarksStore()
        .loadBookmarks()
        .then((res) => {})
    }
  }

  deleteBookmarksFolder(folderId: string) {
    console.log('deleting folder', folderId)
    if (folderId && folderId !== '1') {
      chrome.bookmarks.removeTree(folderId)
    }
  }

  async createBookmarkFolder(folderName: string, parentFolderId: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
    console.log('createing folder', folderName, parentFolderId)
    const res: chrome.bookmarks.BookmarkTreeNode = await chrome.bookmarks.create({
      title: folderName,
      parentId: parentFolderId,
    })
    return Promise.resolve(res)
  }

  async createBookmark(url: string, folderId: string) {
    return chrome.bookmarks.create({
      parentId: folderId,
      title: 'Extensions doc',
      url: url,
    })
  }
}

export default new BookmarksService()
