import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {MarkTabsetAsDefaultCommand} from "src/tabsets/commands/MarkTabsetAsDefault";
import {Tabset, TabsetType} from "src/tabsets/models/Tabset";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeatures";
import {useTabsetService} from "src/services/TabsetService2";
import {useUtils} from "src/services/Utils";

const {sendMsg} = useUtils()

class UndoCommand implements Command<any> {

  constructor(public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult<any>> {
    console.log("execution undo command", this.tabsetId)
    return new MarkTabsetAsDefaultCommand(this.tabsetId).execute()
      .then(res => new ExecutionResult(res, "Tabset was restored again"))
  }

}

export class MarkTabsetDeletedCommand implements Command<Tabset> {

  constructor(
    public tabsetId: string) {
  }

  async execute(): Promise<ExecutionResult<Tabset>> {
    return TabsetService.markAsDeleted(this.tabsetId)
      .then((tabset) => {
        console.log("deleting", tabset.type, tabset.status, tabset.id, useTabsStore().currentTabsetId)
        if (tabset.type === TabsetType.SPECIAL && tabset.id === "BACKUP") {
          //console.log("deactivating")
          usePermissionsStore().deactivateFeature(FeatureIdent.BACKUP.toLowerCase())
        } else if (tabset.type === TabsetType.SPECIAL && tabset.id === "IGNORE") {
          usePermissionsStore().deactivateFeature(FeatureIdent.IGNORE.toLowerCase())
        }
        if (this.tabsetId === useTabsStore().currentTabsetId || useTabsStore().currentTabsetId === null) {
          useTabsetService().selectTabset(undefined)
        }
        return tabset
      })
      .then(res => {
        sendMsg('mark-tabset-deleted', {tabsetId: this.tabsetId})
        return res
      })
      .then(res => Promise.resolve(
        new ExecutionResult(
          res,
          "Tabset deleted",
          new UndoCommand(this.tabsetId)))
      )
      .catch(err => Promise.reject(err))
  }


}

MarkTabsetDeletedCommand.prototype.toString = function cmdToString() {
  return `MarkTabsetDeletedCommand: {tabsetId=${this.tabsetId}}`;
};