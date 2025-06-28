import { uid } from 'quasar'
import { SPECIAL_ID_FOR_NO_GROUP_ASSIGNED, STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Tabset } from 'src/tabsets/models/Tabset'
import { TabsetColumn } from 'src/tabsets/models/TabsetColumn'
import TabsetService from 'src/tabsets/services/TabsetService'
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

export class RenameGroupCommand implements Command<any> {
  constructor(
    public tabset: Tabset,
    public groupId: string,
    public title: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const trustedTitle = this.title.replace(STRIP_CHARS_IN_USER_INPUT, '')
    const existingGroups = this.tabset.columns || []
    const foundGroup = existingGroups.find((existingGroup) => existingGroup.id === this.groupId)
    if (foundGroup) {
      if (existingGroups.find((existingGroup) => existingGroup.title === this.title)) {
        return Promise.reject('group with this name already exists')
      }
      foundGroup.title = trustedTitle
      return useTabsetService()
        .saveTabset(this.tabset)
        .then((res) => Promise.resolve(new ExecutionResult('done', 'Group was renamed')))
        .catch((err) => Promise.reject('could not rename group'))
    } else if (this.groupId === SPECIAL_ID_FOR_NO_GROUP_ASSIGNED) {
      const defaultGroup = new TabsetColumn(SPECIAL_ID_FOR_NO_GROUP_ASSIGNED, trustedTitle)
      if (!this.tabset.columns) {
        this.tabset.columns = []
      }
      this.tabset.columns.push(defaultGroup)
      return useTabsetService()
        .saveTabset(this.tabset)
        .then((res) => Promise.resolve(new ExecutionResult('done', 'Group was renamed')))
        .catch((err) => Promise.reject('could not rename group'))
    } else {
      return Promise.reject(`Could not find group ${this.groupId} to rename to ${trustedTitle}`)
    }
  }
}

RenameGroupCommand.prototype.toString = function cmdToString() {
  return `RenameGroupCommand: {title=${this.title},{groupId=${this.groupId}, {tabsetId=${this.tabset.id}}`
}
