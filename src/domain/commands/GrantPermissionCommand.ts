import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {useBookmarksStore} from "src/stores/bookmarksStore";
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
//import TabsetService from "src/services/TabsetService";
import {useSuggestionsStore} from "src/stores/suggestionsStore";
import {StaticSuggestionIdent} from "src/models/Suggestion";
import {useTabsetService} from "src/services/TabsetService2";
import ChromeApi from "src/services/ChromeApi";
import {useDB} from "src/services/usePersistenceService";


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
          console.log("granted permission", this.permission)
          if ("bookmarks" === this.permission) {
            usePermissionsStore().activateFeature('bookmarks')
            useBookmarksStore().loadBookmarks()
              .then(() => {
               // TabsetService.init()
                useTabsetService().init(useDB(undefined).db)
                ChromeBookmarkListeners.initListeners()
              })
            useSuggestionsStore().removeSuggestion(StaticSuggestionIdent.TRY_BOOKMARKS_FEATURE)
//          } else if ("history" === this.permission) {
//            usePermissionsStore().activateFeature('history')
          } else if ("contextMenus" === this.permission) {
            //usePermissionsStore().grantPermission("notifications")
            ChromeApi.buildContextMenu()
          }
          return new ExecutionResult(
            granted,
            "Permission was added",
            new UndoCommand(this.permission))
        } else {
          console.log("permission was not granted", this.permission)
          usePermissionsStore().deactivateFeature(this.permission)
          return new ExecutionResult(granted, "Permission was not added")
        }
      })
  }

}

GrantPermissionCommand.prototype.toString = function cmdToString() {
  return `GrantPermissionCommand: {permission=${this.permission}}`;
};
