import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {DeleteTabsetCommand} from "src/domain/commands/DeleteTabsetCommand";
import {useTabsetService} from "src/services/TabsetService2";
import {useLoggingServicee} from "src/services/useLoggingService";
import {TabsetType} from "src/models/Tabset";

const {logger} = useLoggingServicee()

class UndoCreateTabsetCommand implements Command<object> {

  constructor(public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult<object>> {
    logger.info("execution of undo command", this.tabsetId)
    return new DeleteTabsetCommand(this.tabsetId).execute()
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was deleted again")))
  }

}

export class CreateTabsetCommand implements Command<object> {

  public merge: boolean = true

  constructor(
    public tabsetName: string,
    public tabsToUse: chrome.tabs.Tab[]) {
  }

  async execute(): Promise<ExecutionResult<object>> {
    try {
      const result = await useTabsetService()
        .saveOrReplaceFromChromeTabs(this.tabsetName, this.tabsToUse, this.merge)
      let doneMsg = 'Tabset ' + this.tabsetName + ' created successfully'
      if (result['replaced' as keyof object] && result['merged' as keyof object]) {
        doneMsg = 'Existing Tabset ' + this.tabsetName + ' can be updated now'
      } else if (result['replaced' as keyof object]) {
        doneMsg = 'Existing Tabset ' + this.tabsetName + ' was overwritten'
      }
      const executionResult = new ExecutionResult(result, doneMsg, new UndoCreateTabsetCommand(result['tabsetId' as keyof object]))
      return Promise.resolve(executionResult)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateTabsetCommand.prototype.toString = function dogToString() {
  return `CreateTabsetCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}, tabs#=${this.tabsToUse.length}}`;
};
