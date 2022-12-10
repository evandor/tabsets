import Command from "src/domain/Command";
import TabsetService from "src/services/TabsetService";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {DeleteTabsetCommand} from "src/domain/commands/DeleteTabsetCommand";


class UndoCreateTabsetCommand implements Command {

  constructor(public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult> {
    console.log("execution undo command", this.tabsetId)
    return new DeleteTabsetCommand(this.tabsetId).execute()
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was deleted again")))
      //.catch(err => console.error(err))
    return Promise.reject(undefined);
  }

}

export class CreateTabsetCommand implements Command {

  public merge: boolean = true

  constructor(
    public tabsetName: string,
    public tabsToUse: chrome.tabs.Tab[]) {
  }

  async execute(): Promise<ExecutionResult> {
    // debug level ?
    try {
      const result = await TabsetService.saveOrReplaceFromChromeTabs(this.tabsetName, this.tabsToUse, this.merge)
      console.log("got result", result)
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
