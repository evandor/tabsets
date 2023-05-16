import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {Tab} from "src/models/Tab";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useUiStore} from "src/stores/uiStore";
import {useUtils} from "src/services/Utils";

const {inBexMode} = useUtils()

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

    useUiStore().clearHighlights()

    tabsStore.currentTabsetId = this.tabsetId;
    localStorage.setItem("selectedTabset", this.tabsetId)
    //useUiService().rightDrawerSetActiveTab(DrawerTabs.UNASSIGNED_TABS)

    if (inBexMode()) {
      const msg = {
        name: 'current-tabset-id-change',
        data: {tabsetId: this.tabsetId}
      }
      console.log("sending message", msg)
      chrome.runtime.sendMessage(msg);
    }

    const executionResult = new ExecutionResult(null, "done")
    return Promise.resolve(executionResult)
  }
}

SelectTabsetCommand.prototype.toString = function cmdToString() {
  return `SelectTabsetCommand: {tabsetId=${this.tabsetId}}`;
};
