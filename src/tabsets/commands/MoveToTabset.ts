import _ from 'lodash'
import { uid } from 'quasar'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

class UndoCommand implements Command<any> {
  constructor(
    public tabId: string,
    public oldTabsetId: string,
    public copy: boolean,
  ) {}

  execute(): Promise<ExecutionResult<any>> {
    return moveToTabset(this.tabId, this.oldTabsetId).then(() => {
      return Promise.resolve(new ExecutionResult('done', 'Tab was moved back'))
    })
  }
}

function moveToTabset(tabId: string, toTabsetId: string, copy: boolean = false): Promise<any> {
  const tabset = useTabsetsStore().tabsetFor(tabId)
  if (tabset) {
    const tabIndex = _.findIndex(tabset.tabs, { id: tabId })
    const targetTabset = useTabsetsStore().getTabset(toTabsetId)

    if (tabIndex >= 0 && targetTabset) {
      targetTabset.tabs.push(tabset.tabs[tabIndex]!)
      return useTabsetService()
        .saveTabset(targetTabset)
        .then(() => {
          if (copy) {
            let tabWithNewId = Object.assign({}, tabset.tabs[tabIndex])
            tabWithNewId['id'] = uid()
            console.log('copying', tabset.tabs[tabIndex], tabWithNewId)
            tabset.tabs.splice(tabIndex, 1, tabWithNewId)
          } else {
            console.log('not copying...')
            tabset.tabs.splice(tabIndex, 1)
          }
        })
        .then(() => useTabsetService().saveTabset(tabset))
    } else {
      return Promise.reject('could not find tab/tabset ' + tabId + '/' + toTabsetId)
    }
  }
  return Promise.reject('could not find tab ' + tabId)
}

export class MoveToTabsetCommand implements Command<any> {
  constructor(
    public tabId: string,
    public tabsetId: string,
    public oldTabsetId: string,
    public copy: boolean = false,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    return moveToTabset(this.tabId, this.tabsetId, this.copy)
      .then(() => {
        if (this.copy) {
          return Promise.resolve(new ExecutionResult('done', 'Tab was copied'))
        } else {
          return Promise.resolve(
            new ExecutionResult(
              'done',
              "Tab was moved - press 'Shift' if you want to copy instead",
              new Map([['Undo', new UndoCommand(this.tabId, this.oldTabsetId, this.copy)]]),
            ),
          )
        }
      })
      .catch((err) => Promise.reject(err))
  }
}

MoveToTabsetCommand.prototype.toString = function cmdToString() {
  return `MoveToTabsetCommand: {tabId=${this.tabId}, {tabsetId=${this.tabsetId}, {oldTabsetId=${this.oldTabsetId}, {copy=${this.copy}}`
}
