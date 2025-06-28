import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'

export class CreateBookmarkFromOpenTabsCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public newIndex: number,
    public parentBookmark: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    //TabLogger.info(this.tab, 'adding tab by d&d, group ' + )
    console.log('adding', this.tab, this.newIndex, this.parentBookmark)
    let useIndex = this.newIndex

    const newBookmark = {
      parentId: this.parentBookmark,
      index: useIndex,
      title: this.tab.title,
      url: this.tab.url,
    }
    console.log('newBookmark', newBookmark)
    const res: chrome.bookmarks.BookmarkTreeNode = await chrome.bookmarks.create(newBookmark)
    Analytics.fireEvent('tabset_createdBookmark_from_opentab', {})
    return new ExecutionResult(res, 'Bookmark was added')
  }
}

CreateBookmarkFromOpenTabsCommand.prototype.toString = function cmdToString() {
  return `CreateBookmarkFromOpenTabsCommand: {tabId=${this.tab.id}, parent=${this.parentBookmark}}`
}
