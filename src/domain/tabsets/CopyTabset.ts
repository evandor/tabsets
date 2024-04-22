import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";
import {Tabset} from "src/models/Tabset";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {DeleteTabsetCommand} from "src/domain/tabsets/DeleteTabset";

class UndoCopyTabsetCommand implements Command<object> {

  constructor(public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult<object>> {
    return new DeleteTabsetCommand(this.tabsetId).execute()
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was deleted again")))
  }

}

export class CopyTabsetCommand implements Command<object> {

  constructor(
    public tabset: Tabset) {
  }

  async execute(): Promise<ExecutionResult<object>> {
    try {
      const result = await useTabsetService().copyFromTabset(this.tabset, useSpacesStore().space)
      return Promise.resolve(new ExecutionResult(
        result,
        "Tabset has been copied",
        new UndoCopyTabsetCommand(result['tabset' as keyof object]['id'])))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CopyTabsetCommand.prototype.toString = function cmdToString() {
  return `CopyTabsetCommand: tabsetName=${this.tabset.name}, tabs#=${this.tabset.tabs.length}}`;
};
