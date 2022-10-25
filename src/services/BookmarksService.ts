import {Bookmark} from "src/models/Bookmark";
import {useBookmarksStore} from "src/stores/bookmarksStore";

class BookmarksService {


  async init() {


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
}

export default new BookmarksService();

