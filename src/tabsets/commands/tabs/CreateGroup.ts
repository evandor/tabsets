import _ from 'lodash'
import { uid } from 'quasar'
import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Tabset } from 'src/tabsets/models/Tabset'
import { TabsetColumn } from 'src/tabsets/models/TabsetColumn'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

class UndoCommand implements Command<any> {
  constructor(
    public tabset: Tabset,
    public groupId: string,
  ) {}

  execute(): Promise<ExecutionResult<any>> {
    this.tabset.columns = _.filter(this.tabset.columns, (g: TabsetColumn) => g.id !== this.groupId)
    return useTabsetService()
      .saveTabset(this.tabset)
      .then((res) => Promise.resolve(new ExecutionResult('done', `Group was deleted again`)))
  }
}

export class CreateGroupCommand implements Command<any> {
  constructor(
    public tabset: Tabset,
    public title: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const trustedTitle = this.title.replace(STRIP_CHARS_IN_USER_INPUT, '')
    const group = new TabsetColumn(uid(), trustedTitle)
    const existingGroups = this.tabset.columns
    if (existingGroups.find((existingGroup) => existingGroup.title === this.title)) {
      return Promise.reject(`Group ${trustedTitle} already exists`)
    }
    this.tabset.columns.push(group)
    return useTabsetService()
      .saveTabset(this.tabset)
      .then((res) =>
        Promise.resolve(
          new ExecutionResult(
            'done',
            `Group ${trustedTitle} was created`,
            new Map([['Undo', new UndoCommand(this.tabset, group.id)]]),
          ),
        ),
      )
      .catch((err) => Promise.reject('could not create group'))
  }
}

CreateGroupCommand.prototype.toString = function cmdToString() {
  return `CreateGroupCommand: {title=${this.title}, {tabsetId=${this.tabset.id}}`
}
