import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useNotificationHandler} from "src/services/ErrorHandler";
import TabsetService from "src/services/TabsetService";

const {handleSuccess, handleError} = useNotificationHandler()

class UndoCommand implements Command<any> {

  constructor(public tabId: string, public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult<any>> {
    return TabsetService.moveToTabset(this.tabId, this.tabsetId)
      .then(() => {
        return Promise.resolve(new ExecutionResult("done", "Tab was moved"))
      })
  }

}

export class MoveToTabsetCommand implements Command<any> {

  constructor(
    public tabId: string,
    public tabsetId: string,
    public oldTabsetId: string,
    public copy: boolean = false) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    return TabsetService.moveToTabset(this.tabId, this.tabsetId)
      .then(() => {
        return Promise.resolve(
          new ExecutionResult("done", "Tab was moved", new UndoCommand(this.tabId, this.oldTabsetId)))
      })
      .catch((err) => Promise.reject(err))
  }

}

MoveToTabsetCommand.prototype.toString = function cmdToString() {
  return `MoveToTabsetCommand: {tabId=${this.tabId}, {tabsetId=${this.tabsetId}, {oldTabsetId=${this.oldTabsetId}, {copy=${this.copy}}`;
};
