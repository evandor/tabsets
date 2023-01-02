import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useLoggingServicee} from "src/services/useLoggingService";
import {usePermissionsStore} from "stores/permissionsStore";
import {GrantOriginCommand} from "src/domain/commands/GrantOriginCommand";
import ChromeApi from "src/services/ChromeApi";

const {TabLogger} = useLoggingServicee()

class UndoCommand implements Command {

  constructor(public origin: string) {
  }

  execute(): Promise<ExecutionResult<boolean>> {
    console.log("execution undo command", this.origin)
    return new GrantOriginCommand(this.origin).execute()
      .then(res => {
        ChromeApi.startWebRequestListener()
        return new ExecutionResult(true, "Origin was granted again")
      })
  }

}

export class RevokeOriginCommand implements Command {

  constructor(public origin: string) {
  }

  async execute(): Promise<ExecutionResult<boolean>> {
    return usePermissionsStore().revokeAllOrigins()
      .then(() => {
        ChromeApi.stopWebRequestListener()
        return new ExecutionResult(
          true,
          "Origin was revoked",
          new UndoCommand(this.origin))
      })
  }

}

RevokeOriginCommand.prototype.toString = function cmdToString() {
  return `RevokeOriginCommand: {origin=${this.origin}}`;
};
