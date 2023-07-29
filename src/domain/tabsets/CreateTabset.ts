import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {DeleteTabsetCommand} from "src/domain/tabsets/DeleteTabset";
import {useTabsetService} from "src/services/TabsetService2";
import {SaveOrReplaceResult} from "src/models/SaveOrReplaceResult";
import {useUtils} from "src/services/Utils";

const {inBexMode, sendMsg} = useUtils()

class UndoCreateTabsetCommand implements Command<object> {

  constructor(public tabsetId: string) {
  }

  execute(): Promise<ExecutionResult<object>> {
    return new DeleteTabsetCommand(this.tabsetId).execute()
      .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was deleted again")))
  }

}

export class CreateTabsetCommand implements Command<SaveOrReplaceResult> {

  public merge: boolean = true

  constructor(
    public tabsetName: string,
    public tabsToUse: chrome.tabs.Tab[]) {
  }

  async execute(): Promise<ExecutionResult<SaveOrReplaceResult>> {
    try {
      const result: SaveOrReplaceResult = await useTabsetService()
        .saveOrReplaceFromChromeTabs(this.tabsetName, this.tabsToUse, this.merge)
        .then(res => {
          //   if (useTabsStore().tabsets.size === 5 && !usePermissionsStore().hasFeature(FeatureIdent.BOOKMARKS) && process.env.MODE === 'bex') {
          //     useSuggestionsStore().addSuggestion(Suggestion.getStaticSuggestion(StaticSuggestionIdent.TRY_BOOKMARKS_FEATURE))
          //   }
          sendMsg('tabset-added', {tabsetId: res.tabset.id})
          return res
        })
      let doneMsg = 'Tabset \'' + this.tabsetName + '\' created successfully'
      if (result['replaced' as keyof object] && result['merged' as keyof object]) {
        doneMsg = 'Existing Tabset \'' + this.tabsetName + '\' can be updated now'
      } else if (result['replaced' as keyof object]) {
        doneMsg = 'Existing Tabset \' ' + this.tabsetName + '\' was overwritten'
      }
      return Promise.resolve(new ExecutionResult<SaveOrReplaceResult>(result, doneMsg, new UndoCreateTabsetCommand(result.tabset.id)))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateTabsetCommand.prototype.toString = function cmdToString() {
  return `CreateTabsetCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}, tabs#=${this.tabsToUse.length}}`;
};
