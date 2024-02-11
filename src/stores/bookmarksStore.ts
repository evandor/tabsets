import {defineStore} from 'pinia';
import _ from "lodash";
import {TreeNode} from "src/models/Tree";
import {Bookmark} from "src/models/Bookmark";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {Tabset} from "src/models/Tabset";

function getChildren(
  parent: chrome.bookmarks.BookmarkTreeNode,
  folderCount: number = 0,
  bmCount: number = 0,
  predicate: (x: chrome.bookmarks.BookmarkTreeNode) => boolean = x => true,
  level: number = 1): TreeNode[] {

  if (parent && parent.children) {
    //let predicate: x: chrome.bookmarks.BookmarkTreeNode => string = (x:chrome.bookmarks.BookmarkTreeNode) => !x.url;
    return _.map(_.filter(parent.children, predicate), c => {
      const childrenWithoutPredicate = getChildren(c, bmCount)
      const children = getChildren(c, folderCount,bmCount, predicate)
      bmCount += children.length
      return new TreeNode(
        c.id,
        c.title,
        c.url ? c.title : c.title + ' (' + childrenWithoutPredicate.length + ')',
        c.url,
        c.url ? 'o_article' : 'o_folder',
        children,
        folderCount + 1,
        bmCount + children.length
        )
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
    bookmarksForFolder: null as unknown as Bookmark[],

    bookmarksCount: 0,
    foldersCount: 0
  }),

  getters: {
    findBookmarksForUrl: (state) => {
      return async (url: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
        const res = await browser.bookmarks.search({url:url})
        return res
      }
    }
  },

  actions: {
    init() {
      console.debug(" ...initializing bookmarkStore")
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
      if (accessGranted) {
        console.debug(" ...loading bookmarks")//, (new Error()).stack)
        // @ts-ignore
        const bookmarks: object[] = await browser.bookmarks.search({})//, async (bookmarks) => {
        this.bookmarksLeaves = bookmarks

        // @ts-ignore
        const tree: chrome.bookmarks.BookmarkTreeNode[] = await browser.bookmarks.getTree()

        _.forEach(tree[0].children, parent => {
          const children: TreeNode[] = getChildren(parent)
          for (const c of children) {
            this.bookmarksCount += c.subNodesCount
            this.foldersCount += c.subFoldersCount
          }

          const treeNode = new TreeNode(parent.id, parent.title, parent.title, parent.url, 'o_folder', children)
          this.bookmarksTree.push(treeNode)

          const childrenNodes: TreeNode[] = getChildren(parent, 0,0,x => !x.url)
          for (const c of childrenNodes) {
            this.bookmarksCount += c.subNodesCount
            this.foldersCount += c.subFoldersCount
          }
          this.bookmarksNodes.push(new TreeNode(parent.id, parent.title, parent.title, parent.url, 'o_folder', childrenNodes))

          this.foldersCount+=1

        })
        //console.log("loading bookmarks done")
        return Promise.resolve()

      }

    },
    async bookmarksLeavesFor(bookmarkId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
      this.bookmarksLeaves = []
      // @ts-ignore
      const res = await browser.bookmarks.getChildren(bookmarkId)
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
      browser.bookmarks.search({url: from}, (results: chrome.bookmarks.BookmarkTreeNode[]) => {
        results.forEach((r: chrome.bookmarks.BookmarkTreeNode) => {
          browser.bookmarks.update(r.id, {url: to}, updateResult => {
            console.log("updated bookmark", updateResult)
          })
        })
      })
    }

  }
});
