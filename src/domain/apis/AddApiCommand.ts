import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useEntitiesService} from "src/services/EntityService";
import {useEntitiesStore} from "stores/entitiesStore";
import {useApisStore} from "stores/apisStore";

export class AddApiCommand implements Command<string> {

  public merge: boolean = true

  constructor(
    public name: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    try {
      const res =  await useApisStore().createApi(this.name)
      return new ExecutionResult<string>("","done")
    } catch (err) {
      return Promise.reject(err)
    }
  }


}

AddApiCommand.prototype.toString = function cmdToString() {
  return `AddApiCommand: {name=${this.name}}`;
};