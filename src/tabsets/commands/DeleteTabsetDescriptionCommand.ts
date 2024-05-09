import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";
import {TabsetStatus} from "src/tabsets/models/Tabset";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

class UndoCommand implements Command<TabsetStatus> {

  constructor(public tabsetId: string, public tabsetPage: string) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    const tabset = useTabsetsStore().getTabset(this.tabsetId)
    if (tabset) {
      tabset.page = this.tabsetPage
      const res = await useTabsetService().saveTabset(tabset)
      return new ExecutionResult(res, "Description was reverted")
    }
    return Promise.reject("could not get tabset id")
  }

}

export class DeleteTabsetDescriptionCommand implements Command<string> {

  constructor(public tabsetId: string, public tabsetPage: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    return useTabsetService().deleteTabsetDescription(this.tabsetId)
      .then(res => {
        //sendMsg('...', {tabsetId: this.tabsetId})
        return res
      })
      .then(res => Promise.resolve(new ExecutionResult(res, "Description deleted", new UndoCommand(this.tabsetId, this.tabsetPage))))
      .catch(err => Promise.reject(err))
  }
}

DeleteTabsetDescriptionCommand.prototype.toString = function cmdToString() {
  return `DeleteTabsetDescriptionCommand: {tabsetId=${this.tabsetId}}`;
};
