class BookmarksService {


  async init() {


  }

  deleteBookmarksFolder(folderId: string) {
    console.log("deleting folder", folderId)
    if (folderId && folderId !== '1') {
      chrome.bookmarks.removeTree(folderId)
    }
  }
}

export default new BookmarksService();

