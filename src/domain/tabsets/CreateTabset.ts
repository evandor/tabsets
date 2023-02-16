import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {DeleteTabsetCommand} from "src/domain/tabsets/DeleteTabset";
import {useTabsetService} from "src/services/TabsetService2";
import LoggingService from "src/services/LoggingService";
import {useTabsStore} from "src/stores/tabsStore";

class UndoCreateTabsetCommand implements Command<object> {

  constructor(public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult<object>> {
    LoggingService.logger.info("execution of undo command", this.tabsetId)
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
        .then(res => {
          if (useTabsStore().tabsets.size === 1) {
           // NotificationsService.addNotification(new Notification(uid(), 'Congrats!', 'You created your first tabset'))
            //NotificationsService.addNotification(new SharedTabsetNotification("tsid"))
          }
          return res
        })
      let doneMsg = 'Tabset ' + this.tabsetName + ' created successfully'
      if (result['replaced' as keyof object] && result['merged' as keyof object]) {
        doneMsg = 'Existing Tabset ' + this.tabsetName + ' can be updated now'
      } else if (result['replaced' as keyof object]) {
        doneMsg = 'Existing Tabset ' + this.tabsetName + ' was overwritten'
      }
      const executionResult = new ExecutionResult(result, doneMsg, new UndoCreateTabsetCommand(result['tabset' as keyof object]['id']))
      return Promise.resolve(executionResult)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateTabsetCommand.prototype.toString = function dogToString() {
  return `CreateTabsetCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}, tabs#=${this.tabsToUse.length}}`;
};
