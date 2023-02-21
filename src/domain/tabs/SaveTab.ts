import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import {TabLogger} from "src/logging/TabLogger";
import {usePermissionsStore} from "stores/permissionsStore";
import MHtmlService from "src/services/MHtmlService";
import {useNotificationHandler} from "src/services/ErrorHandler";

const {handleSuccess, handleError} = useNotificationHandler()

class UndoCommand implements Command<any> {

  constructor(public tab: Tab) {
  }

  execute(): Promise<ExecutionResult<any>> {
    TabLogger.info(this.tab, `deleting saved tab`)
//    return MHtmlService.deleteMHtml(this.tab)
//      .then(res => new ExecutionResult(res, "Tab's title change was undone"))
    return Promise.reject("not yet implemented")
  }

}

export class SaveTabCommand implements Command<any> {

  constructor(
    public tab: Tab) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    if (!usePermissionsStore().hasPermission('pageCapture')) {
      handleError("missing permission pageCapture")
      return Promise.reject("xxx")
    } else if (this.tab.chromeTab.id) {
      console.log("capturing", this.tab.chromeTab.id)
      // TODO cannot return from "saveAsHTML" as the callback cannot be turned into a promise
      chrome.pageCapture.saveAsMHTML({tabId: this.tab.chromeTab.id},
        (html: any) => {
          return MHtmlService.saveMHtml(this.tab, html)
            .then((res) => {
              handleSuccess(
                new ExecutionResult(
                  "done",
                  "Tab was saved",
                  new UndoCommand(this.tab)))
            }).catch(err => {
              return handleError(err)
            })
        })

      return Promise.resolve(
        new ExecutionResult("dummy", "this should not be called from UI"))
    } else {
      return Promise.reject("yyy")
    }

  }

}

SaveTabCommand.prototype.toString = function cmdToString() {
  return `SaveTabCommand: {tabId=${this.tab.id}}`;
};
