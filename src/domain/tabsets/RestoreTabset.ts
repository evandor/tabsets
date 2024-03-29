import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";
import {useTabsStore} from "src/stores/tabsStore";
import ChromeApi from "src/services/ChromeApi";



export class RestoreTabsetCommand implements Command<string> {

  public merge: boolean = true

  constructor(
    public tabsetId: string,
    public windowName: string | undefined = undefined,
    public inNewWindow: boolean = true) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    console.log("restoring from tabset", this.tabsetId)
    try {
      const tabset = useTabsetService().getTabset(this.tabsetId)
      if (tabset) {
        console.log("found tabset for id", this.tabsetId)
        ChromeApi.restore(tabset, this.windowName, this.inNewWindow)
        return new ExecutionResult("result", "doneMsg")
      }
      return Promise.reject("could not find tabset")
    } catch (ex) {
      return Promise.reject(ex)
    }
  }
}

RestoreTabsetCommand.prototype.toString = function cmdToString() {
  return `RestoreTabsetCommand: {tabsetName=${this.tabsetId}, inNewWindow=${this.inNewWindow}}`;
};
