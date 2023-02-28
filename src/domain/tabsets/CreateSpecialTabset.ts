import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";
import {TabsetType} from "src/models/Tabset";

export enum SpecialTabsetIdent {
  BACKUP = "BACKUP",
  IGNORE = "IGNORE"
}


export class CreateSpecialTabsetCommand implements Command<object> {

  constructor(
    public tabsetIdent: SpecialTabsetIdent,
    public tabsetType: TabsetType
  ) {
  }

  async execute(): Promise<ExecutionResult<object>> {
    try {
      const result = await useTabsetService().getOrCreateSpecialTabset(this.tabsetIdent, this.tabsetType)
      return Promise.resolve(new ExecutionResult(result, 'Special Tabset created successfully'))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateSpecialTabsetCommand.prototype.toString = function cmdToString() {
  return `CreateSpecialTabsetCommand: {tabsetIdent=${this.tabsetIdent}, {tabsetType=${this.tabsetType}}`;
};
