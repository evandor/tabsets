import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import {Tabset} from "src/models/Tabset";
import {useTabsetService} from "src/services/TabsetService2";
import {Entity} from "src/models/Entity";
import {useEntitiesStore} from "stores/entitiesStore";
import {useEntitiesService} from "src/services/EntitiesService";

const { deleteEntity} = useEntitiesService()

// class UndoCommand implements Command<any> {
//
//
//   constructor(public tabset: Tabset, public tab: Tab) {
//   }
//
//   execute(): Promise<ExecutionResult<any>> {
//     console.log("execution undo command", this.tab, this.tabset)
//     return saveToTabset(this.tabset, this.tab)
//       .then((res) => new ExecutionResult(res, "Tab has been restored again"))
//   }
//
// }

export class DeleteEntityCommand implements Command<any> {

  constructor(public type: string, public collectionId: string, public entity: Entity) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    return deleteEntity(this.type, this.collectionId, this.entity.id)
      .then(tabset => Promise.resolve(new ExecutionResult(
        tabset,        "Tab was deleted")))
      .catch(err => Promise.reject(err))
  }
}


DeleteEntityCommand.prototype.toString = function cmdToString() {
  return `DeleteEntityCommand: {type=${this.type}, {collectionId=${this.collectionId}, {entity.id=${this.entity.id}}`;
};
