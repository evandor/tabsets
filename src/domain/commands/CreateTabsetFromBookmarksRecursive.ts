import _ from 'lodash'
import BrowserApi from 'src/app/BrowserApi'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useUiStore } from 'src/ui/stores/uiStore'

async function createTabsetFrom(name: string, bookmarkId: string) {
  console.log('creating recursively', name, bookmarkId)
  const subTree: chrome.bookmarks.BookmarkTreeNode[] = await BrowserApi.childrenFor(bookmarkId)
  const folders = _.filter(subTree, (e: chrome.bookmarks.BookmarkTreeNode) => e.url === undefined)
  const nodes = _.filter(subTree, (e: chrome.bookmarks.BookmarkTreeNode) => e.url !== undefined)
  const subfolders: Tabset[] = []
  for (const f of folders) {
    console.log('found folder', f)
    const subTabset = await createTabsetFrom(f.title, f.id)
    subfolders.push(subTabset)
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
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    //console.log('creating recursively', this.name, this.bookmarkId)
    const tabset = await createTabsetFrom(this.name, '' + this.bookmarkId)
    return Promise.resolve(new ExecutionResult(tabset, 'done'))
  }
}
