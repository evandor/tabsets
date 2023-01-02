import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useLoggingServicee} from "src/services/useLoggingService";
import {usePermissionsStore} from "stores/permissionsStore";
import {RevokeOriginCommand} from "src/domain/commands/RevokeOriginCommand";
import ChromeApi from "src/services/ChromeApi";

const {TabLogger} = useLoggingServicee()

class UndoCommand implements Command {

  constructor(public origin: string) {
  }

  execute(): Promise<ExecutionResult<boolean>> {
    console.log("execution undo command", this.origin)
    return new RevokeOriginCommand(this.origin).execute()
      .then(res => {
        ChromeApi.stopWebRequestListener()
        return new ExecutionResult(true, "Origin was revoked again")
      })
  }

}

export class GrantOriginCommand implements Command {

  constructor(public origin: string) {
  }

  async execute(): Promise<ExecutionResult<boolean>> {
    return usePermissionsStore().grantAllOrigins()
      .then((granted: boolean) => {
        if (granted) {
          ChromeApi.startWebRequestListener()
          return new ExecutionResult(
            granted,
            "Origin was added",
            new UndoCommand(this.origin))
        } else {
          return new ExecutionResult(granted, "Origin was not granted")
        }
      })
  }

}

GrantOriginCommand.prototype.toString = function cmdToString() {
  return `GrantOriginCommand: {origin=${this.origin}}`;
};
