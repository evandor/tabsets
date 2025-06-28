import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { useLogger } from 'src/core/services/Logger'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

const { info } = useLogger()

export class RenameFolderCommand implements Command<string> {
  constructor(
    public tabset: Tabset,
    public folder: Tabset,
    public newName: string,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    console.log('set folder name', this.tabset.id, this.folder.id, this.newName)
    // TODO validation
    if (this.newName && this.newName.toString().trim().length > 0) {
      this.folder.name = this.newName.toString().trim()
      await useTabsetService().saveTabset(this.tabset)
      info('renamed folder')
      Analytics.fireEvent('tabset_folder_renamed', {})
      return Promise.resolve(new ExecutionResult('done', 'done'))
    }
    return Promise.reject('name was not valid')
  }
}
