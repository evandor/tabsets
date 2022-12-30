import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {DeleteTabsetCommand} from "src/domain/commands/DeleteTabsetCommand";
import {useTabsetService} from "src/services/TabsetService2";
import {useLoggingServicee} from "src/services/useLoggingService";
import {Tabset, TabsetType} from "src/models/Tabset";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"

const {logger} = useLoggingServicee()

class UndoCommand implements Command {

  constructor(public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult<object>> {
    logger.info("execution of undo command", this.tabsetId)
    return new DeleteTabsetCommand(this.tabsetId).execute()
      .then(res => Promise.resolve(new ExecutionResult(res, "Session was deleted again")))
  }

}

export class CreateSessionCommand implements Command {

  public merge: boolean = true

  constructor(
    public sessionName: string,
    public tabsToUse: chrome.tabs.Tab[]) {
  }

  async execute(): Promise<ExecutionResult<object>> {
    try {
      _.forEach([...useTabsStore().tabsets.values()], (ts: Tabset) => {
        if (ts.type === TabsetType.SESSION) {
          ts.type = TabsetType.DEFAULT
          useTabsetService().saveTabset(ts)
        }
      })
      const result = await useTabsetService()
        .saveOrReplaceFromChromeTabs(this.sessionName, this.tabsToUse, this.merge, TabsetType.SESSION)
      let doneMsg = 'Session ' + this.sessionName + ' created successfully'
      if (result['replaced' as keyof object] && result['merged' as keyof object]) {
        doneMsg = 'Existing Session ' + this.sessionName + ' can be updated now'
      } else if (result['replaced' as keyof object]) {
        doneMsg = 'Existing Session ' + this.sessionName + ' was overwritten'
      }
      const executionResult = new ExecutionResult(result, doneMsg, new UndoCommand(result['tabsetId' as keyof object]))
      return Promise.resolve(executionResult)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateSessionCommand.prototype.toString = function dogToString() {
  return `CreateSessionCommand: {merge=${this.merge}, tabsetName=${this.sessionName}, tabs#=${this.tabsToUse.length}}`;
};
