import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";

const {deleteTabset} = useTabsetService()

export class DeleteTabsetCommand implements Command<string> {

  constructor(public tabsetId: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    return deleteTabset(this.tabsetId)
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was deleted")))
      .catch(err => Promise.reject(err))
  }
}
