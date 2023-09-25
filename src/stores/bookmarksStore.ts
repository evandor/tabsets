import {defineStore} from 'pinia';
import _ from "lodash";
import {TreeNode} from "src/models/Tree";
import {Bookmark} from "src/models/Bookmark";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {Tabset} from "src/models/Tabset";

function getChildren(
  parent: chrome.bookmarks.BookmarkTreeNode,
  predicate: (x: chrome.bookmarks.BookmarkTreeNode) => boolean = x => true,
  level: number = 1): TreeNode[] {

  if (parent && parent.children) {
    //let predicate: x: chrome.bookmarks.BookmarkTreeNode => string = (x:chrome.bookmarks.BookmarkTreeNode) => !x.url;
    return _.map(_.filter(parent.children, predicate), c => {
      const childrenWithoutPredicate = getChildren(c)
      const children = getChildren(c, predicate)
      return new TreeNode(
        c.id,
        c.title,
        c.url ? c.title : c.title + ' (' + childrenWithoutPredicate.length + ')',
        c.url,
        c.url ? 'o_article' : 'o_folder',
        children)
    })
  } else {
    return [];
  }
}

export const  useBookmarksStore = defineStore('bookmarks', {
  state: () => ({
    bookmarksTree: [] as unknown as object[],
    bookmarksNodes: [] as unknown as object[],
    bookmarksLeaves: [] as unknown as object[],
    currentBookmark: null as unknown as Bookmark,

    // the bookmarks (nodes and leaves) for the selected parent id
    bookmarksForFolder: null as unknown as Bookmark[]
  }),

  getters: {
    findBookmarksForUrl: (state) => {
      return async (url: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
        const res = await chrome.bookmarks.search({url:url})
        return res
      }
    }
  },

  actions: {
    init() {
      console.debug("initializing bookmarkStore")
      if (process.env.MODE !== 'bex') {
        return Promise.resolve()
      }
      this.initListeners()
    },
    async loadBookmarks(): Promise<void> {
      this.bookmarksTree = []
      this.bookmarksNodes = []
      this.bookmarksLeaves = []
      const accessGranted = usePermissionsStore().hasPermission("bookmarks") && usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS)
      console.debug("loading bookmarks", accessGranted)//, (new Error()).stack)
      if (accessGranted) {
        // @ts-ignore
        const bookmarks: object[] = await chrome.bookmarks.search({})//, async (bookmarks) => {
        this.bookmarksLeaves = bookmarks

        // @ts-ignore
        const tree: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getTree()

        _.forEach(tree[0].children, parent => {
          const children: TreeNode[] = getChildren(parent)
          const treeNode = new TreeNode(parent.id, parent.title, parent.title, parent.url, 'o_folder', children)
          this.bookmarksTree.push(treeNode)

          const childrenNodes: TreeNode[] = getChildren(parent, x => !x.url)
          this.bookmarksNodes.push(new TreeNode(parent.id, parent.title, parent.title, parent.url, 'o_folder', childrenNodes))
        })
        //console.log("loading bookmarks done")
        return Promise.resolve()

      }

    },
    async bookmarksLeavesFor(bookmarkId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
      this.bookmarksLeaves = []
      // @ts-ignore
      const res = await chrome.bookmarks.getChildren(bookmarkId)
      // @ts-ignore
      return res
    },
    remove(bm: Bookmark) {
      this.bookmarksForFolder = _.filter(this.bookmarksForFolder, (e: Bookmark) => e.id !== bm.id)
    },
    initListeners() {
      // moved to chromeBookmarkListeners
    },
    updateUrl(from: string, to: string) {
      chrome.bookmarks.search({url: from}, (results: chrome.bookmarks.BookmarkTreeNode[]) => {
        results.forEach((r: chrome.bookmarks.BookmarkTreeNode) => {
          chrome.bookmarks.update(r.id, {url: to}, updateResult => {
            console.log("updated bookmark", updateResult)
          })
        })
      })
    }

  }
});
