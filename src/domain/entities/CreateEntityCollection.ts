import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";
import {useTabsStore} from "src/stores/tabsStore";
import {useSuggestionsStore} from "src/stores/suggestionsStore";
import {StaticSuggestionIdent, Suggestion} from "src/models/Suggestion";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {TabsetType} from "src/models/Tabset";
import {useEntitiesService} from "src/services/EntitiesService";

// class UndoCreateTabsetCommand implements Command<object> {
//
//   constructor(public tabsetId: string) {
//   }
//
//   execute(): Promise<ExecutionResult<object>> {
//     return new DeleteTabsetCommand(this.tabsetId).execute()
//       .then(res => Promise.resolve(new ExecutionResult(res, "Tabset was deleted again")))
//   }
//
// }

export class CreateEntityCollection implements Command<object> {

  public merge: boolean = true

  constructor(
    public collectionType: string,
    public collectionName: string) {
  }

  async execute(): Promise<ExecutionResult<object>> {
    try {
      const result = await useEntitiesService()
        .createCollection(this.collectionType, this.collectionName)
        .then(res => {
          console.log("res", res)
          return res
        })
      let doneMsg = 'Collection ' + this.collectionName + ' created successfully'
      const executionResult = new ExecutionResult(result, doneMsg)
      return Promise.resolve(executionResult)
    } catch (err) {
      console.log("got errror", err)
      return Promise.reject(err)
    }
  }
}

CreateEntityCollection.prototype.toString = function cmdToString() {
  return `CreateEntityCollection: type: ${this.collectionType}, name: ${this.collectionName}}`;
};
