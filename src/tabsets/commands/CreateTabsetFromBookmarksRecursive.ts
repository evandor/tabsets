import _ from 'lodash'
import BrowserApi from 'src/app/BrowserApi'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useUiStore } from 'src/ui/stores/uiStore'

async function createTabsetFrom(name: string, bookmarkId: string, recurse: boolean): Promise<Tabset> {
  console.log('creating recursively', name, bookmarkId, recurse)
  const subTree: chrome.bookmarks.BookmarkTreeNode[] = await BrowserApi.childrenFor(bookmarkId)
  const folders = _.filter(subTree, (e: chrome.bookmarks.BookmarkTreeNode) => e.url === undefined)
  const nodes = _.filter(subTree, (e: chrome.bookmarks.BookmarkTreeNode) => e.url !== undefined)
  const subfolders: Tabset[] = []
  if (recurse) {
    for (const f of folders) {
      console.log('found folder', f)
      const subTabset = await createTabsetFrom(f.title, f.id, recurse)
      subfolders.push(subTabset)
    }
  }
  const result = await useTabsetService().saveOrReplaceFromBookmarks(name, nodes, true, true)
  console.log('result', result)
  const ts: Tabset = result['tabset' as keyof object]
  ts.folders = subfolders
  ts.bookmarkId = bookmarkId
  useUiStore().importedBookmarks.push(bookmarkId)
  subfolders.forEach((f) => (f.folderParent = ts.id))
  return ts
}

export class CreateTabsetFromBookmarksRecursive implements Command<Tabset> {
  constructor(
    public name: string,
    public bookmarkId: string,
    public recurse: boolean,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tabset = await createTabsetFrom(this.name, '' + this.bookmarkId, this.recurse)
    tabset.bookmarkId = this.bookmarkId
    Analytics.fireEvent('tabset_created_from_bookmarks_recursive', { tabsCount: tabset.tabs.length })
    return Promise.resolve(new ExecutionResult(tabset, 'done'))
  }
}

CreateTabsetFromBookmarksRecursive.prototype.toString = function cmdToString() {
  return `CreateTabsetFromBookmarksRecursive: {name=${this.name}, bookmarkId=${this.bookmarkId}}`
}
