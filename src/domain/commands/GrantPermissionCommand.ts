import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useLoggingServicee} from "src/services/useLoggingService";
import {usePermissionsStore} from "stores/permissionsStore";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";

const {TabLogger} = useLoggingServicee()

class UndoCommand implements Command {

  constructor(public permission: string) {
  }

  execute(): Promise<ExecutionResult<boolean>> {
    console.log("execution undo command", this.permission)
    return new RevokePermissionCommand(this.permission).execute()
      .then(res => new ExecutionResult(true, "Permission was revoked again"))
  }

}

export class GrantPermissionCommand implements Command {

  constructor(public permission: string) {
  }

  async execute(): Promise<ExecutionResult<boolean>> {
    return usePermissionsStore().grantPermission(this.permission)
      .then((granted: boolean) => {
        if (granted) {
          return new ExecutionResult(
            granted,
            "Permission was added",
            new UndoCommand(this.permission))
        } else {
          return new ExecutionResult(granted, "Permission was not added")
        }
      })
  }

}

GrantPermissionCommand.prototype.toString = function cmdToString() {
  return `GrantPermissionCommand: {permission=${this.permission}}`;
};
