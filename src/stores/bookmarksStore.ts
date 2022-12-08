import {defineStore} from 'pinia';
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import _ from "lodash";
import {TreeNode} from "src/models/Tree";
import {Bookmark} from "src/models/Bookmark";

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

export const useBookmarksStore = defineStore('bookmarks', {
  state: () => ({
    bookmarksTree: [] as unknown as object[],
    bookmarksNodes: [] as unknown as object[],
    bookmarksLeaves: [] as unknown as object[],
    currentBookmark: null as unknown as Bookmark,

    // the bookmarks (nodes and leaves) for the selected parent id
    bookmarksForFolder: null as unknown as Bookmark[]
  }),

  getters: {},

  actions: {
    init() {
      console.debug("initializing bookmarkStore")
      this.loadBookmarks()
      this.initListeners()
    },
    async loadBookmarks(): Promise<void> {
      this.bookmarksTree = []
      this.bookmarksNodes = []
      chrome.bookmarks.search({}, bookmarks => {
        //console.log("xxx", bookmarks)
        this.bookmarksLeaves = bookmarks
      })

      // @ts-ignore
      const tree: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getTree()

      _.forEach(tree[0].children, parent => {
        const children: TreeNode[] = getChildren(parent)
        const treeNode = new TreeNode(parent.id, parent.title, parent.title, parent.url, 'o_folder', children)
        this.bookmarksTree.push(treeNode)

        const childrenNodes: TreeNode[] = getChildren(parent, x => !x.url)
        this.bookmarksNodes.push(new TreeNode(parent.id, parent.title, parent.title, parent.url, 'o_folder', childrenNodes))
      })

      return Promise.resolve()

    },
    async bookmarksLeavesFor(bookmarkId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
      this.bookmarksLeaves = []
      // chrome.bookmarks.getChildren(bookmarkId, (a: chrome.bookmarks.BookmarkTreeNode[]) => {
      //   console.log("found", a)
      //   this.bookmarksLeaves = a
      // })
      // @ts-ignore
      const res = await chrome.bookmarks.getChildren(bookmarkId)
      //console.log("res", res)
      // @ts-ignore
      return res
    },
    remove(bm: Bookmark) {
      this.bookmarksForFolder = _.filter(this.bookmarksForFolder, (e: Bookmark) => e.id !== bm.id)
    },
    initListeners() {
      chrome.bookmarks.onCreated.addListener((name: string, bm: any) => ChromeBookmarkListeners.onCreated(bm))
      chrome.bookmarks.onMoved.addListener((id: string, info: any) => ChromeBookmarkListeners.reload())
      chrome.bookmarks.onRemoved.addListener((id: string, info: any) => ChromeBookmarkListeners.reload())
      chrome.bookmarks.onChanged.addListener((id: string, info: any) => ChromeBookmarkListeners.reload())
      chrome.bookmarks.onChildrenReordered.addListener((id: string, info: any) => ChromeBookmarkListeners.reload())
    }
  }
});
