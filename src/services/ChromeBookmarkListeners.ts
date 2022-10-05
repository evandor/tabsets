import {useBookmarksStore} from "stores/bookmarksStore";
import throttledQueue from "throttled-queue";
import {useTabsStore} from "stores/tabsStore";


class ChromeBookmarkListeners {

  inProgress = false;

  clearWorking() {
    if (this.inProgress) {
      //console.log("resetting 'inProgress' to false")
      const tabsStore = useTabsStore()
      useBookmarksStore().loadBookmarks()
        .then(() => console.log("loaded when clearing workload"))
    }
    this.inProgress = false
  }

  intervalID = setInterval(() => this.clearWorking(), 5000);

  eventTriggered() {
    this.inProgress = true
  }

  // @ts-ignore
  onCreated(bm: chrome.bookmarks.BookmarkTreeNode) {
    this.eventTriggered()
    if (!this.inProgress) {
      let msg = `bookmark ${bm.url} created`
      console.log("msg", msg)
      useBookmarksStore().loadBookmarks()
        .then(() => console.log("loaded on Created"))
    }
  }


  reload() {
    useBookmarksStore().loadBookmarks()
      .then(() => console.log("loaded on reload"))
  }
}

export default new ChromeBookmarkListeners();

