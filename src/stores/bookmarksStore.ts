import {defineStore} from 'pinia';
import _ from "lodash";
import {TreeNode} from "src/models/Tree";
import {Bookmark} from "src/models/Bookmark";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";

function nodesFrom(
  parent: chrome.bookmarks.BookmarkTreeNode,
  allFoldersCount = 0,
  allBookmarksCount = 0,
  level: number = 1): [TreeNode | undefined, TreeNode | undefined, number, number] {

  const parentNode = new TreeNode(parent.id, parent.title, parent.title, parent.url, parent.url ? 'o_article' : 'o_folder', [], 0, 0)
  level++
  let subNodes: TreeNode[] = []
  let nonLeafSubNodes: TreeNode[] = []
  let foldersCount = 0
  let leavesCount = 0
  if (parent.children) {
    for (const c of parent.children) {
      const [allNodes, nonLeafNodes, fCount, bCount] = nodesFrom(c, allFoldersCount, allBookmarksCount)
      foldersCount += foldersCount
      leavesCount += bCount
      if (allNodes && allNodes.url) {
        leavesCount++
      } else {
        foldersCount++
      }
      if (allNodes) {
        subNodes.push(allNodes)
      }
    }
  }
  parentNode.children = subNodes
  parentNode.subFoldersCount = foldersCount
  parentNode.subNodesCount = leavesCount
 // console.log("+++ added node with", parentNode.title, parentNode.header, parentNode.children, parentNode.url)
  return [parentNode, parentNode.header === 'node' ? parentNode : undefined, allFoldersCount + foldersCount, allBookmarksCount + leavesCount]
}

export const useBookmarksStore = defineStore('bookmarks', {
  state: () => ({
    bookmarksTree: [] as unknown as object[],
    bookmarksNodes: [] as unknown as object[],
    nonLeafNodes: [] as unknown as object[],
    bookmarksNodes2: [] as unknown as object[],
    bookmarksLeaves: [] as unknown as object[],
    currentBookmark: null as unknown as Bookmark,
    folderCount: 0,
    bmsCount: 0,

    // the bookmarks (nodes and leaves) for the selected parent id
    bookmarksForFolder: null as unknown as Bookmark[],

    bookmarksCount: 0,
    foldersCount: 0
  }),

  getters: {
    findBookmarksForUrl: (state) => {
      return async (url: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
        const res = await chrome.bookmarks.search({url: url})
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
      this.bookmarksNodes2 = []
      this.nonLeafNodes = []
      this.bookmarksLeaves = []
      const accessGranted = usePermissionsStore().hasPermission("bookmarks") && usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS)
      if (accessGranted) {
        console.debug(" ...loading bookmarks")//, (new Error()).stack)
        // @ts-ignore
        const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.search({})//, async (bookmarks) => {
        this.bookmarksLeaves = bookmarks

        // @ts-ignore
        const tree: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getTree()

       //console.log("*** ======= tree", tree)
        const nodes = nodesFrom(tree[0])
        //console.log("bookmarksNodes2", nodes)
        this.bookmarksNodes2 = nodes[0] ? nodes[0].children : []
        this.nonLeafNodes = nodes[1] ? nodes[1].children : []
        this.folderCount = nodes[2]
        this.bmsCount = nodes[3]


        return Promise.resolve()

      }

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
