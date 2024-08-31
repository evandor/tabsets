import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {TabsetType} from "src/tabsets/models/Tabset";

export enum SpecialTabsetIdent {
  BACKUP = "BACKUP",
  IGNORE = "IGNORE",
  HELP = "HELP"
}


export class CreateSpecialTabsetCommand implements Command<object> {

  constructor(
    public tabsetIdent: SpecialTabsetIdent,
    public tabsetType: TabsetType
  ) {
  }

  async execute(): Promise<ExecutionResult<object>> {
    try {
      const result = await useTabsetService()
          .getOrCreateSpecialTabset(this.tabsetIdent, this.tabsetType)

      return Promise.resolve(new ExecutionResult(result, 'Special Tabset created successfully'))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateSpecialTabsetCommand.prototype.toString = function cmdToString() {
  return `CreateSpecialTabsetCommand: {tabsetIdent=${this.tabsetIdent}, {tabsetType=${this.tabsetType}}`;
};
