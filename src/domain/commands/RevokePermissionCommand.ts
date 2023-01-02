import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useLoggingServicee} from "src/services/useLoggingService";
import {usePermissionsStore} from "stores/permissionsStore";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {useBookmarksStore} from "stores/bookmarksStore";
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import TabsetService from "src/services/TabsetService";

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
        if ("bookmarks" === this.permission) {
          useBookmarksStore().loadBookmarks()
            .then(() => {
              ChromeBookmarkListeners.removeListeners()
              TabsetService.init()
            })
        }
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
