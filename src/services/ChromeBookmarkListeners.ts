import {useBookmarksStore} from "stores/bookmarksStore";


class ChromeBookmarkListeners {

  inProgress = false;

  // @ts-ignore
  onCreated(bm: chrome.bookmarks.BookmarkTreeNode) {
    let msg = `bookmark ${bm.url} created`
    useBookmarksStore().loadBookmarks()
  }


  reload() {
    useBookmarksStore().loadBookmarks()
  }
}

export default new ChromeBookmarkListeners();

