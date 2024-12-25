import _ from 'lodash'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { TabsetColumn } from 'src/tabsets/models/TabsetColumn'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

// class UndoCommand implements Command<any> {
//
//   constructor(public tabId: string, public oldTabsetId: string, public copy: boolean) {
//   }
//
//   execute(): Promise<ExecutionResult<any>> {
//     return TabsetService.moveToTabset(this.tabId, this.oldTabsetId)
//       .then(() => {
//         return Promise.resolve(new ExecutionResult("done", "Tab was moved back"))
//       })
//   }
//
// }

export class DeleteGroupCommand implements Command<any> {
  constructor(
    public tabset: Tabset,
    public groupId: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const existingGroups = this.tabset.columns
    const foundGroup = existingGroups.find((existingGroup) => existingGroup.id === this.groupId)
    if (foundGroup) {
      _.forEach(this.tabset.tabs, (t: Tab) => {
        if (t.columnId === this.groupId) {
          t.columnId = undefined
        }
      })
      this.tabset.columns = _.filter(
        this.tabset.columns,
        (g: TabsetColumn) => g.id !== this.groupId,
      )
      return useTabsetService()
        .saveTabset(this.tabset)
        .then((res) =>
          Promise.resolve(new ExecutionResult('done', 'Group was deleted and its tabs unassigned')),
        )
        .catch((err) => Promise.reject('could not delete group'))
    } else {
      return Promise.reject(`Could not find group to delete`)
    }
  }
}

DeleteGroupCommand.prototype.toString = function cmdToString() {
  return `DeleteGroupCommand: {groupId=${this.groupId}, {tabsetId=${this.tabset.id}}`
}
