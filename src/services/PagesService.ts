class PagesService {


  async init() {
    console.debug("initializing PagesService")
  }

  deletePage(pageId: string) {
    console.log("deleting page", pageId)
    if (pageId ) {
      //chrome.bookmarks.removeTree(pageId)
    }
  }

}

export default new PagesService();

