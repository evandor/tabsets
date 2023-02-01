import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {usePermissionsStore} from "stores/permissionsStore";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {useBookmarksStore} from "stores/bookmarksStore";
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import TabsetService from "src/services/TabsetService";


class UndoCommand implements Command<boolean> {

  constructor(public permission: string) {
  }

  execute(): Promise<ExecutionResult<boolean>> {
    console.log("execution undo command", this.permission)
    return new RevokePermissionCommand(this.permission).execute()
      .then(res => new ExecutionResult(true, "Permission was revoked again"))
  }

}

export class GrantPermissionCommand implements Command<boolean> {

  constructor(public permission: string) {
  }

  async execute(): Promise<ExecutionResult<boolean>> {
    return usePermissionsStore().grantPermission(this.permission)
      .then((granted: boolean) => {
        if (granted) {
          if ("bookmarks" === this.permission) {
            usePermissionsStore().activateFeature('bookmarks')
            useBookmarksStore().loadBookmarks()
              .then(() => {
                TabsetService.init()
                ChromeBookmarkListeners.initListeners()
              })
          } else if ("history" === this.permission) {
            usePermissionsStore().activateFeature('history')
          }
          return new ExecutionResult(
            granted,
            "Permission was added",
            new UndoCommand(this.permission))
        } else {
          usePermissionsStore().deactivateFeature(this.permission)
          return new ExecutionResult(granted, "Permission was not added")
        }
      })
  }

}

GrantPermissionCommand.prototype.toString = function cmdToString() {
  return `GrantPermissionCommand: {permission=${this.permission}}`;
};
