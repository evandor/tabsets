import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";

class UndoRenameTabsetCommand implements Command<any> {

  constructor(public tabsetId: string, public oldName: string) {
  }

  execute(): Promise<ExecutionResult<any>> {
    console.log("execution undo command", this.tabsetId, this.oldName)
    return new RenameTabsetCommand(this.tabsetId, this.oldName).execute()
      .then(res => new ExecutionResult(res, "Tabset was renamed back again"))
  }

}

export class RenameTabsetCommand implements Command<any> {

  constructor(
    public tabsetId: string,
    public newName: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    return TabsetService.rename(this.tabsetId, this.newName)
      .then(oldName => Promise.resolve(
        new ExecutionResult(
          oldName,
          "Tabset was renamed",
          new UndoRenameTabsetCommand(this.tabsetId, oldName)))
      )
      .catch(err => Promise.reject(err))
  }


}
