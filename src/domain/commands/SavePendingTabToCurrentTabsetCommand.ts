import Command from "src/domain/Command";
import TabsetService from "src/services/TabsetService";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import {useSearchStore} from "stores/searchStore";
import TabService from "src/services/TabService";
import _ from "lodash";
import {useTabsStore} from "stores/tabsStore";
import {useLoggingServicee} from "src/services/useLoggingService";

const {TabLogger} = useLoggingServicee()

class UndoCommand implements Command<undefined> {

  constructor(public tab: Tab) {
  }

  execute(): Promise<ExecutionResult<undefined>> {
    console.log("execution undo command", this.tab)
    // return new DeleteTabsetCommand(this.tabsetId).execute()
    //   .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was deleted again")))
    return Promise.reject(undefined);
  }

}

export class SavePendingTabToCurrentTabsetCommand implements Command<number> {

  constructor(public tab: Tab) {
  }

  async execute(): Promise<ExecutionResult<number>> {
    return TabsetService.saveToCurrentTabset(this.tab)
      .then(() => this.removeFromPendingTabset(this.tab))
      .then(() => this.unExpireThumbnail(this.tab))
      .then(() => this.unExpireContent(this.tab))
      .then(result => this.addToSearchIndex(result, this.tab))
      .then(result => new ExecutionResult(
        result,
        "Tab was added",
        new UndoCommand(this.tab)))
  }

  // update fuse index
  private addToSearchIndex(dataFromStore: object, tab: Tab) {
    TabLogger.info(tab, "in saveToTabset: adding to search index")
    return useSearchStore().addToIndex(
      tab.id,
      tab.chromeTab.title || '',
      tab.chromeTab.title || '',
      tab.chromeTab.url || '',
      dataFromStore ? dataFromStore['description' as keyof object] : '',
      dataFromStore ? dataFromStore['content' as keyof object] : '',
      [tab.id],
      tab.chromeTab.favIconUrl || '')
  }

  private unExpireThumbnail(tab: Tab): Promise<void> {
    TabLogger.info(tab, "un-expiring thumbnail")
    return TabService.updateThumbnail(tab.chromeTab.url)
  }

  private unExpireContent(tab: Tab): Promise<object> {
    TabLogger.info(tab, "un-expiring content")
    return TabService.updateContent(tab.chromeTab.url)
  }

  private removeFromPendingTabset(tab: Tab) {
    const tabsStore = useTabsStore()
    const index = _.findIndex(tabsStore.pendingTabset.tabs, t => t.id === tab.id)
    tabsStore.pendingTabset.tabs.splice(index, 1);
    return index;
  }
}

SavePendingTabToCurrentTabsetCommand.prototype.toString = function cmdToString() {
  return `SavePendingTabToCurrentTabsetCommand: {tab=${this.tab.toString()}}`;
};
