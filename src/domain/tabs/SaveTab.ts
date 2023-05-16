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
      // TODO cannot return from "saveAsHTML" as the callback cannot be turned into a promise
      chrome.pageCapture.saveAsMHTML({tabId: this.tab.chromeTab.id},
        (html: Blob) => {
          return MHtmlService.saveMHtml(this.tab, html)
            .then((res) => {
              if (this.tabset) {
                let mhtmls: string[] | undefined = this.tab['mhtmls']
                if (!mhtmls) {
                  mhtmls= []
                }
                mhtmls.push(res)
                this.tab['mhtmls'] = mhtmls
                console.log("this.tab", this.tab)
                useTabsetService().saveTabset(this.tabset)
              }
              return res;
            })
            .then((res) => {
              handleSuccess(
                new ExecutionResult(
                  "done",
                  "Tab was saved",
                  new UndoCommand(this.tab)))
            })
            .catch(err => {
              return handleError(err)
            })
        })

      return Promise.resolve(
        new ExecutionResult("dummy", "this should not be called from UI"))
    } else {
      return Promise.reject("general problem saving tab")
    }

  }

}

SaveTabCommand.prototype.toString = function cmdToString() {
  return `SaveTabCommand: {tabId=${this.tab.id}}`;
};
