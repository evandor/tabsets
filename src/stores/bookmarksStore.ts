import {defineStore} from 'pinia';
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import _ from "lodash";
import {TreeNode} from "src/models/Tree";

function getChildren(parent: chrome.bookmarks.BookmarkTreeNode, level: number = 1): TreeNode[] {
  if (parent && parent.children) {
    const children = _.map(parent.children, c => {
      const children = getChildren(c)
      return new TreeNode(
        c.id,
        c.title,
        c.url ? c.title : c.title + ' (' + children.length + ')',
        c.url,
        c.url ? 'o_article' : 'o_folder',
        children)
    })
    return children
  } else {
    return [];
  }
}

export const useBookmarksStore = defineStore('bookmarks', {
  state: () => ({
    bookmarksTree: [] as unknown as object[]
  }),

  getters: {


  },

  actions: {
    init() {
      if (useFeatureTogglesStore().bookmarksEnabled) {
        console.log("initializing bookmark Listeners")
        this.loadBookmarks()
        this.initListeners()
      }
    },
    loadBookmarks() {
      this.bookmarksTree = []
      chrome.bookmarks.getTree(
        (a: chrome.bookmarks.BookmarkTreeNode[]) => {
          //console.log("a[0].children", a[0].children)
          _.forEach(a[0].children, parent => {
            const children: TreeNode[] = getChildren(parent)
            const treeNode = new TreeNode(parent.id, parent.title, parent.title, parent.url,'o_folder', children)
            this.bookmarksTree.push(treeNode)
          })
          // console.log("bookmarksTree.value", bookmarksTree.value)
        }
      )
    },
    initListeners() {
      chrome.bookmarks.onCreated.addListener((name: string, bm:any) => ChromeBookmarkListeners.onCreated(bm))
      chrome.bookmarks.onMoved.addListener((id: string, info: any) => ChromeBookmarkListeners.reload())
      chrome.bookmarks.onRemoved.addListener((id: string, info: any) => ChromeBookmarkListeners.reload())
      chrome.bookmarks.onChanged.addListener((id: string, info:any) => ChromeBookmarkListeners.reload())
      chrome.bookmarks.onChildrenReordered.addListener((id:string, info:any) => ChromeBookmarkListeners.reload())
    }

  }
});
