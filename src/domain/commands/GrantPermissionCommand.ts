import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";
import {useBookmarksStore} from "src/bookmarks/stores/bookmarksStore";
import ChromeBookmarkListeners from "src/services/ChromeBookmarkListeners";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import {StaticSuggestionIdent} from "src/suggestions/models/Suggestion";
import {useTabsetService} from "src/services/TabsetService2";
import {useDB} from "src/services/usePersistenceService";
import {useFeaturesStore} from "src/features/stores/featuresStore";

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
            useFeaturesStore().activateFeature('bookmarks')
            useBookmarksStore().loadBookmarks()
              .then(() => {
                // TabsetService.init()
                useTabsetService().init(useDB(undefined).db)
                ChromeBookmarkListeners.initListeners()
              })
            useSuggestionsStore().removeSuggestion(StaticSuggestionIdent.TRY_BOOKMARKS_FEATURE)
//          } else if ("history" === this.permission) {
//            useFeaturesStore().activateFeature('history')
          } else if ("notifications" === this.permission) {
            useFeaturesStore().activateFeature('notifications')
          // } else if ("contextMenus" === this.permission) {
          //   //usePermissionsStore().grantPermission("notifications")
          //   ChromeApi.buildContextMenu()
          }
          return new ExecutionResult(
            granted,
            "Permission was added",
            new UndoCommand(this.permission))
        } else {
          console.log("permission was not granted", this.permission)
          useFeaturesStore().deactivateFeature(this.permission)
          return new ExecutionResult(granted, "Permission was not added")
        }
      })
  }

}

GrantPermissionCommand.prototype.toString = function cmdToString() {
  return `GrantPermissionCommand: {permission=${this.permission}}`;
};
