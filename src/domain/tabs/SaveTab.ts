import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import {usePermissionsStore} from "src/stores/permissionsStore";
import MHtmlService from "src/services/MHtmlService";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {Tabset} from "src/models/Tabset";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";

const {handleSuccess, handleError} = useNotificationHandler()

class UndoCommand implements Command<any> {

  constructor(public tab: Tab) {
  }

  execute(): Promise<ExecutionResult<any>> {
    // TabLogger.info(this.tab, `deleting saved tab`)
//    return MHtmlService.deleteMHtml(this.tab)
//      .then(res => new ExecutionResult(res, "Tab's title change was undone"))
    return Promise.reject("not yet implemented")
  }

}

export class SaveTabCommand implements Command<any> {

  constructor(
    public tabset: Tabset | undefined,
    public tab: Tab) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    if (!usePermissionsStore().hasPermission('pageCapture')) {
      handleError("missing permission pageCapture")
      return Promise.reject("missing permission pageCapture!")
    } else if (this.tab.chromeTab.id) {
      console.log("capturing", typeof this.tab, this.tab.chromeTab.id)
      return Promise.resolve(
        new ExecutionResult("dummy", "this should not be called from UI"))
    } else {
      return Promise.reject("save tab not implemented")
    }

  }

}

SaveTabCommand.prototype.toString = function cmdToString() {
  return `SaveTabCommand: {tabId=${this.tab.id}}`;
};
