import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useLoggingServicee} from "src/services/useLoggingService";
import {usePermissionsStore} from "stores/permissionsStore";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";

const {TabLogger} = useLoggingServicee()

class UndoCommand implements Command {

  constructor(public permission: string) {
  }

  execute(): Promise<ExecutionResult<boolean>> {
    console.log("execution undo command", this.permission)
    return new GrantPermissionCommand(this.permission).execute()
      .then(res => new ExecutionResult(true, "Permission was granted again"))
  }

}

export class RevokePermissionCommand implements Command {

  constructor(public permission: string) {
  }

  async execute(): Promise<ExecutionResult<boolean>> {
    return usePermissionsStore().revokePermission(this.permission)
      .then(() => {
        return new ExecutionResult(
          true,
          "Permission was revoked",
          new UndoCommand(this.permission))
      })
  }

}

RevokePermissionCommand.prototype.toString = function cmdToString() {
  return `RevokePermissionCommand: {permission=${this.permission}}`;
};
