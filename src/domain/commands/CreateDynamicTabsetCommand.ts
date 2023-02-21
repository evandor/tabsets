import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {DeleteTabsetCommand} from "src/domain/tabsets/DeleteTabset";
import {useTabsetService} from "src/services/TabsetService2";
import LoggingService from "src/services/LoggingService";
import {useTabsStore} from "src/stores/tabsStore";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {Tabset, TabsetType} from "src/models/Tabset";
import {DynamicTabSource, DynamicTabSourceType} from "src/models/DynamicTabSource";

class UndoCreateTabsetCommand implements Command<object> {

  constructor(public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult<object>> {
    LoggingService.logger.info("execution of undo command", this.tabsetId)
    return new DeleteTabsetCommand(this.tabsetId).execute()
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was deleted again")))
  }

}

export class CreateDynamicTabsetCommand implements Command<object> {

  public merge: boolean = true

  constructor(
    public tabsetName: string,
  ) {
  }

  async execute(): Promise<ExecutionResult<object>> {
    try {
      // const result = await useTabsetService()
      //   .saveOrReplaceFromChromeTabs(this.tabsetName, this.tabsToUse, this.merge)
      const result: NewOrReplacedTabset = await useTabsStore()
        .updateOrCreateTabset("Wikipedia", [], false, TabsetType.DYNAMIC)
      if (result && result.tabset) {

        // result.tabset.dynamicTabs = async () => {
        //   const wikiPage = await wiki.page("List_of_most_visited_websites")
        //   const tables = await wikiPage.tables()
        //   console.log("tables", tables)
        //   return Array<Tab>() // Promise.resolve(Tab[])
        // }
        result.tabset.dynamicTabs = new DynamicTabSource(DynamicTabSourceType.WIKIPEDIA)
        console.log("tabset", result.tabset)
        await useTabsetService().saveTabset(result.tabset)
      }

      const executionResult = new ExecutionResult(result, "doneMsg", new UndoCreateTabsetCommand(result['tabsetId' as keyof object]))
      return Promise.resolve(executionResult)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateDynamicTabsetCommand.prototype.toString = function cmdToString() {
  return `CreateDynamicTabsetCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}}`;
};
