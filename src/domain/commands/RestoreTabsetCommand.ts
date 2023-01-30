import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";
import {useTabsStore} from "src/stores/tabsStore";
import ChromeApi from "src/services/ChromeApi";



export class RestoreTabsetCommand implements Command<string> {

  public merge: boolean = true

  constructor(
    public tabsetId: string,
    public inNewWindow: Boolean = true) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    console.log("restoring from tabset", this.tabsetId)
    const tabsStore = useTabsStore()
    try {
      tabsStore.deactivateListeners()
      // if (closeOldTabs) {
      //   await ChromeApi.closeAllTabs()
      // }
      const tabset = useTabsetService().getTabset(this.tabsetId)
      if (tabset) {
        console.log("found tabset for id", this.tabsetId)
        ChromeApi.restore(tabset)
        // .then((res: any) => {
        //   console.log("res", res)
        //   tabsStore.activateListeners()
        // })
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
