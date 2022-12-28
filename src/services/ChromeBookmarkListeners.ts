import {useBookmarksStore} from "src/stores/bookmarksStore";
import {useTabsStore} from "src/stores/tabsStore";


class ChromeBookmarkListeners {

  inProgress = false;

  initListeners() {
    chrome.permissions.contains(
      {permissions: ["bookmarks"]},
      (res: boolean) => {
        if (res) {
          chrome.bookmarks.onCreated.addListener((name: string, bm: any) => this.onCreated(bm))
          chrome.bookmarks.onMoved.addListener((id: string, info: any) => this.reload())
          chrome.bookmarks.onRemoved.addListener((id: string, info: any) => this.reload())
          chrome.bookmarks.onChanged.addListener((id: string, info: any) => this.reload())
          chrome.bookmarks.onChildrenReordered.addListener((id: string, info: any) => this.reload())
        }
      })

  }

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

