import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {Tab} from "src/models/Tab";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useUiStore} from "src/stores/uiStore";
import {useUtils} from "src/services/Utils";
import {Tabset} from "src/models/Tabset";

const {inBexMode} = useUtils()

export class SelectTabsetCommand implements Command<Tabset | undefined> {

  public merge: boolean = true

  constructor(
    public tabsetId: string) {
  }

  // TODO selecting a tabset from a different space should change space
  async execute(): Promise<ExecutionResult<Tabset | undefined>> {
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
      chrome.runtime.sendMessage(msg, (callback) => {
        console.log("got callback", callback)
        if (chrome.runtime.lastError) {
          // ignore
        }
      });
    }

    const executionResult = new ExecutionResult(currentTabset, "done")
    return Promise.resolve(executionResult)
  }
}

SelectTabsetCommand.prototype.toString = function cmdToString() {
  return `SelectTabsetCommand: {tabsetId=${this.tabsetId}}`;
};
