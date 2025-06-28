import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { useGroupsStore } from 'src/tabsets/stores/groupsStore'

export class DeleteChromeGroupCommand implements Command<string> {
  constructor(public groupTitle: string) {}

  async execute(): Promise<ExecutionResult<string>> {
    return useGroupsStore()
      .deleteGroupByTitle(this.groupTitle)
      .then((res) => {
        Analytics.fireEvent('tabset_group_deleted', {})
        return new ExecutionResult('', 'Chrome Group was removed')
      })
  }
}

DeleteChromeGroupCommand.prototype.toString = function cmdToString() {
  return `DeleteChromeGroupCommand: {groupTitle=${this.groupTitle}}`
}
