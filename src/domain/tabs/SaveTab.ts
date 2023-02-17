import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";
import LoggingService from "src/services/LoggingService";
import {TabLogger} from "src/logging/TabLogger";
import {useSearchStore} from "src/stores/searchStore";
import {usePermissionsStore} from "stores/permissionsStore";
import MHtmlService from "src/services/MHtmlService";

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
      return Promise.reject("missing permission pageCapture")
    } else if (this.tab.chromeTab.id) {
      console.log("capturing", this.tab.chromeTab.id)
      chrome.pageCapture.saveAsMHTML({tabId: this.tab.chromeTab.id},
        (html: any) => {
          console.log("html", html)
          return MHtmlService.saveMHtml(this.tab, html)
            .then((res) => {
              return Promise.resolve(
                new ExecutionResult(
                  "done",
                  "Tab was saved!",
                  new UndoCommand(this.tab)))
            }).catch(err => {
              return Promise.reject("got error: " + err)
            })
        })
      // TODO cannot return from "saveAsHTML" as the callback is returning void?
      return Promise.resolve(
        new ExecutionResult(
          "done",
          "Tab was saved",
          new UndoCommand(this.tab)))
    } else {
      return Promise.reject("")
    }

  }

}

SaveTabCommand.prototype.toString = function dogToString() {
  return `SaveTabCommand: {tabId=${this.tab.id}}`;
};
