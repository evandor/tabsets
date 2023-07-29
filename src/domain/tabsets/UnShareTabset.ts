import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {TabsetSharing} from "src/models/Tabset";
import {useAuth0} from "@auth0/auth0-vue";
import {useAuthStore} from "stores/auth";

export class UnShareTabsetCommand implements Command<any> {

  constructor(
    public tabsetId: string) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    return TabsetService.share(this.tabsetId, TabsetSharing.UNSHARED, undefined)
      .then(oldSharing => Promise.resolve(
        new ExecutionResult(
          oldSharing,
          "The tabset not shared anymore"))
      )
      .catch(err => Promise.reject(err))
  }

}

UnShareTabsetCommand.prototype.toString = function cmdToString() {
  return `UnShareTabsetCommand: {tabsetId=${this.tabsetId}}`;
};
