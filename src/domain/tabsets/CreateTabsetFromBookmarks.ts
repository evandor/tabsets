import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { DeleteTabsFromTabsetCommand } from 'src/tabsets/commands/DeleteTabsFromTabsetCommand'

export enum OrgLevel {
  SPACE = 'SPACE',
  TABSET = 'TABSET',
  TABSET_COLUMN = 'TABSET_COLUMN',
}
class UndoCommand implements Command<object> {
  constructor(
    public tabsetId: string,
    public updated: number,
  ) {}

  execute(): Promise<ExecutionResult<object>> {
    //logger.info("execution of undo command", this.tabsetId, this.updated)
    return new DeleteTabsFromTabsetCommand(this.tabsetId, this.updated)
      .execute()
      .then((res) => Promise.resolve(new ExecutionResult(res, res.message)))
  }
}

export class CreateTabsetFromBookmarksCommand implements Command<object> {
  public merge: boolean = true

  constructor(
    public tabsetName: string,
    public bmsToUse: chrome.bookmarks.BookmarkTreeNode[],
    public level: OrgLevel = OrgLevel.TABSET,
  ) {}

  async execute(): Promise<ExecutionResult<object>> {
    try {
      const result = await useTabsetService().saveOrReplaceFromBookmarks(
        this.tabsetName,
        this.bmsToUse,
        this.merge,
      )
      let doneMsg = 'imported from bookmarks'
      if (result['replaced' as keyof object] && result['merged' as keyof object]) {
        doneMsg = 'Existing Tabset ' + this.tabsetName + ' was updated'
      } else if (result['replaced' as keyof object]) {
        doneMsg = 'Existing Tabset ' + this.tabsetName + ' was overwritten'
      }
      // const executionResult = new ExecutionResult(result, doneMsg, new UndoCommand(result['tabsetId' as keyof object], result['updated' as keyof object]))
      const executionResult = new ExecutionResult(
        result,
        doneMsg,
        new Map([
          [
            'Undo',
            new UndoCommand(result['tabsetId' as keyof object], result['updated' as keyof object]),
          ],
        ]),
      )
      return Promise.resolve(executionResult)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}
