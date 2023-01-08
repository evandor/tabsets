import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useLoggingServicee} from "src/services/useLoggingService";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {Tab} from "src/models/Tab";
import {useNotificationsStore} from "stores/notificationsStore";

const {logger} = useLoggingServicee()


export class SelectTabsetCommand implements Command<object> {

  public merge: boolean = true

  constructor(
    public tabsetId: string) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    console.debug("selecting tabset", this.tabsetId)
    const tabsStore = useTabsStore()

    const currentTabset = tabsStore.tabsets.get(tabsStore.currentTabsetId)
    if (currentTabset) {
      _.forEach(currentTabset.tabs, (t: Tab) => t.selected = false)
    }
    useNotificationsStore().setSelectedTab(null as unknown as Tab)

    tabsStore.currentTabsetId = this.tabsetId;
    localStorage.setItem("selectedTabset", this.tabsetId)
    const executionResult = new ExecutionResult(null, "done")
    return Promise.resolve(executionResult)
  }
}

SelectTabsetCommand.prototype.toString = function dogToString() {
  return `SelectTabsetCommand: {tabsetId=${this.tabsetId}}`;
};
