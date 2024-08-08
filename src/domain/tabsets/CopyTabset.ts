import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {Tabset} from "src/tabsets/models/Tabset";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {DeleteTabsetCommand} from "src/tabsets/commands/DeleteTabset";

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
      const result = await useTabsetService().copyFromTabset(this.tabset, useSpacesStore().space?.id || undefined)
      return Promise.resolve(new ExecutionResult(
        result,
        "Tabset has been copied"))
        //new UndoCopyTabsetCommand(result['tabset' as keyof object]['id'])))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CopyTabsetCommand.prototype.toString = function cmdToString() {
  return `CopyTabsetCommand: tabsetName=${this.tabset.name}, tabs#=${this.tabset.tabs.length}}`;
};
