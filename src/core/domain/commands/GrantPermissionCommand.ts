import Command from 'src/core/domain/Command'
import { RevokePermissionCommand } from 'src/core/domain/commands/RevokePermissionCommand'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { usePermissionsStore } from 'src/core/stores/usePermissionsStore'

class UndoCommand implements Command<boolean> {
  constructor(public permission: string) {}

  execute(): Promise<ExecutionResult<boolean>> {
    console.log('execution undo command', this.permission)
    return new RevokePermissionCommand(this.permission)
      .execute()
      .then((res) => new ExecutionResult(true, 'Permission was revoked again'))
  }
}

export class GrantPermissionCommand implements Command<boolean> {
  constructor(public permission: string) {}

  async execute(): Promise<ExecutionResult<boolean>> {
    return usePermissionsStore()
      .grantPermission(this.permission)
      .then((granted: boolean) => {
        if (granted) {
          console.log('granted permission', this.permission)
          // if ("bookmarks" === this.permission) {
          //   useFeaturesStore().activateFeature('bookmarks')
          //   useBookmarksStore().loadBookmarks()
          //     .then(() => {
          //       ChromeBookmarkListeners.initListeners()
          //     })
          //   useSuggestionsStore().removeSuggestion('TRY_BOOKMARKS_FEATURE')
          // } else if ("notifications" === this.permission) {
          //   useFeaturesStore().activateFeature('notifications')
          // }
          return new ExecutionResult(
            granted,
            'Permission was added',
            new Map([['Undo', new UndoCommand(this.permission)]]),
          )
        } else {
          console.log('permission was not granted', this.permission)
          //useFeaturesStore().deactivateFeature(this.permission)
          return new ExecutionResult(granted, 'Permission was not added')
        }
      })
  }
}

GrantPermissionCommand.prototype.toString = function cmdToString() {
  return `GrantPermissionCommand: {permission=${this.permission}}`
}
