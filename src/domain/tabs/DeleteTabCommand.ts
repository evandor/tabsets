import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import {Tabset, TabsetSharing} from "src/models/Tabset";
import {useTabsetService} from "src/services/TabsetService2";
import {useUtils} from "src/services/Utils";
import {useTabsStore} from "stores/tabsStore";
import BookmarksService from "src/services/BookmarksService";
import {useBookmarksStore} from "stores/bookmarksStore";
import {useQuasar} from "quasar";

const {addToTabset, deleteTab} = useTabsetService()
const {inBexMode, sendMsg} = useUtils()

class UndoCommand implements Command<any> {


  constructor(public tabset: Tabset, public tab: Tab) {
  }

  execute(): Promise<ExecutionResult<any>> {
    console.log("execution undo command", this.tab, this.tabset)
    return addToTabset(this.tabset, this.tab)
      .then((res) => new ExecutionResult(res, "Tab has been restored again"))
  }

}

export class DeleteTabCommand implements Command<Tabset> {

  constructor(public tab: Tab) {
  }

  async execute(): Promise<ExecutionResult<Tabset>> {
    return deleteTab(this.tab)
      .then((tabset: Tabset) => {
        // sharing
        if (tabset.sharedId && tabset.sharing === TabsetSharing.PUBLIC) {
          tabset.sharing = TabsetSharing.PUBLIC_OUTDATED
        }
        return tabset
      })
      .then(tabset => Promise.resolve(new ExecutionResult(
        tabset,
        "Tab was deleted",
        new UndoCommand(tabset, this.tab))))
      .then((res) => {
        sendMsg('tab-deleted', {tabsetId: res.result.id})
        return res
      })
      .catch(err => Promise.reject(err))
  }
}


DeleteTabCommand.prototype.toString = function cmdToString() {
  return `DeleteTabCommand: {tab.id=${this.tab.id}, tab.url=${this.tab.url}}`;
};
