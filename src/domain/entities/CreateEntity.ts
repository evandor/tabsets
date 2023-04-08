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
import {useEntitiesStore} from "stores/entitiesStore";
import {EntityDefinition, Field} from "src/models/EntityDefinition";
import {forEach} from "lodash";
import {api} from "boot/axios";

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

export class CreateEntityCommand implements Command<object> {

  public merge: boolean = true

  constructor(
    public collectionType: string,
    public collectionId: string,
    public entity: object) {
  }

  async execute(): Promise<ExecutionResult<object>> {
    try {
      console.log("creating entity", this.collectionType, this.collectionId, this.entity)
      const result = await useEntitiesService()
        .addToCollection(this.collectionType, this.collectionId, this.entity)
        .then(res => {
          console.log("res", res)
          const entityDefinition = useEntitiesStore().entityDefinitions.get(this.collectionType)
          const promises: Promise<any>[] = []
          if (entityDefinition) {
            const fields = entityDefinition.fields
            forEach(fields, field => {
              if (field.derivedFrom) {
                const derivedField = field.derivedFrom
                console.log("derivedField", derivedField)
                const ident = this.entity[derivedField.ident as keyof object]
                console.log("ident", ident)
                promises.push(api.get(ident).then((res) => {
                  console.log("res.data", res.data)
                  var doc = (new DOMParser).parseFromString(res.data, "text/html");
                  const selected = doc.querySelector("#instrumentChartDE0008404005")
                  const imgSrc = selected?.getAttribute("src")
                  console.log("selected src", imgSrc)
                  if (imgSrc) {
                    field.value = imgSrc
                  }
                }))
              }
            })
            return Promise.all(promises)
              .then((promise) => {
                console.log("promise", typeof promise, promise)
                useEntitiesService().saveCollection(this.collectionType, res)
                return res
              })
          } else {
            useEntitiesService().saveCollection(this.collectionType, res)
            return res
          }

        })
      let doneMsg = 'Entity  created successfully'
      const executionResult = new ExecutionResult(result, doneMsg)
      return Promise.resolve(executionResult)
    } catch (err) {
      console.log("got errror", err)
      return Promise.reject(err)
    }
  }
}

CreateEntityCommand.prototype.toString = function cmdToString() {
  return `CreateEntityCommand: type: ${this.collectionType}, id: ${this.collectionId}, entity: ${this.entity}}`;
};
