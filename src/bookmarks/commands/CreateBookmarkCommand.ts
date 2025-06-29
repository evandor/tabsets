import BookmarksService from 'src/bookmarks/services/BookmarksService'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'

export class CreateBookmarkCommand implements Command<object> {
  public merge: boolean = true

  constructor(
    public tab: chrome.tabs.Tab,
    public folderId: string,
  ) {}

  async execute(): Promise<ExecutionResult<object>> {
    try {
      if (!this.tab.url) {
        return Promise.reject('url is missing')
      }
      const result = BookmarksService.createBookmark(this.tab.url, this.folderId)
      //let doneMsg = 'Folder ' + this.folderName + ' created successfully'
      const executionResult = new ExecutionResult(result, 'doneMsg')
      return Promise.resolve(executionResult)
    } catch (err) {
      return Promise.reject('err')
    }
  }
}

CreateBookmarkCommand.prototype.toString = function cmdToString() {
  return `CreateBookmarkCommand: {tabId=${this.tab.id}, folderId=${this.folderId}}`
}
