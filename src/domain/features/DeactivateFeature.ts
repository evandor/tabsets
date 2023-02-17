import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {usePermissionsStore} from "stores/permissionsStore";
import {AppFeature} from "src/models/AppFeatures";


export class DeactivateFeatureCommand implements Command<any> {

  constructor(
    public feature: AppFeature) {
  }


  async execute(): Promise<ExecutionResult<any>> {
    usePermissionsStore().deactivateFeature(this.feature.ident.toLowerCase())
    return Promise.resolve(
      new ExecutionResult(
        "done",
        `Feature ${this.feature.ident.toLowerCase()} was deactivated`))
  }

}

DeactivateFeatureCommand.prototype.toString = function dogToString() {
  return `DeactivateFeatureCommand: {feature=${this.feature.ident}}`;
};
