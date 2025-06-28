import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

export class DeleteTabsetFolderCommand implements Command<string> {
  constructor(
    public tabset: Tabset,
    public folder: Tabset,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    return (
      useTabsetService()
        .deleteTabsetFolder(this.tabset, this.folder)
        // .then(res => {
        //   //sendMsg('...', {tabsetId: this.tabsetId})
        //   return res
        // })
        .then((res) => {
          Analytics.fireEvent('tabset_folder_deleted', {})
          return Promise.resolve(new ExecutionResult(res, 'Folder deleted'))
        })
        .catch((err) => Promise.reject(err))
    )
  }
}

DeleteTabsetFolderCommand.prototype.toString = function cmdToString() {
  return `DeleteTabsetFolderCommand: {tabsetId=${this.tabset.id}, {folderId=${this.folder.id}}`
}
