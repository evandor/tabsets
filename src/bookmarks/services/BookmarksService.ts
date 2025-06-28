import {Bookmark} from "src/bookmarks/models/Bookmark";
import {useBookmarksStore} from "src/bookmarks/stores/bookmarksStore";
import {useUtils} from "src/core/services/Utils";

const {inBexMode} = useUtils()

async function getParentChain(parentId: string, chain: string[] = []): Promise<string[]> {
  if (!parentId || parentId === "0") {
    return chain
  }
  // @ts-ignore
  const results: any[] = await chrome.bookmarks.get(parentId)
  if (results && results.length > 0 && results[0] !== "0") {
    chain.push(results[0].parentId)
    return getParentChain(results[0].parentId, chain)
  }
  return chain;
}

class BookmarksService {

  async init() {
    console.debug(" ...initializing BookmarksService")
    if (inBexMode()) {
      useBookmarksStore().loadBookmarks()
        .then(res => {
        })
    }
  }

  deleteBookmarksFolder(folderId: string) {
    console.log("deleting folder", folderId)
    if (folderId && folderId !== '1') {
      chrome.bookmarks.removeTree(folderId)
    }
  }

  deleteBookmark(bm: Bookmark) {
    chrome.bookmarks.remove(bm.chromeBookmark.id)
    useBookmarksStore().remove(bm)
  }

  async createBookmarkFolder(folderName: string, parentFolderId: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
    console.log("createing folder", folderName, parentFolderId)
    // @ts-ignore
    const res: chrome.bookmarks.BookmarkTreeNode = await chrome.bookmarks.create({
      title: folderName,
      parentId: parentFolderId
    })
    return Promise.resolve(res)
  }

  async createBookmark(url: string, folderId: string) {
    return chrome.bookmarks.create({
      'parentId': folderId,
      'title': 'Extensions doc',
      'url': url
    });
  }
}

export default new BookmarksService();

