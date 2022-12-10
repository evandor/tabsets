import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";


export class DeleteTabsetCommand implements Command {

  constructor(public tabsetId: string) {
  }

  async execute(): Promise<ExecutionResult> {
    return TabsetService.delete(this.tabsetId)
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was deleted")))
      .catch(err => Promise.reject(err))
  }
}
