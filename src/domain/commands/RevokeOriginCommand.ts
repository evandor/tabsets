import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {GrantOriginCommand} from "src/domain/commands/GrantOriginCommand";
import {FeatureIdent} from "src/models/AppFeature";

class UndoCommand implements Command<boolean> {

  constructor(public feature: string) {
  }

  execute(): Promise<ExecutionResult<boolean>> {
    console.log("execution undo command")
    return new GrantOriginCommand(this.feature).execute()
      .then(res => {
        switch (this.feature) {
          case "thumbnails":
            usePermissionsStore().activateFeature(this.feature)
            break;

          default:
            Promise.reject("feature " + this.feature + " is unknown")
        }

        return new ExecutionResult(true, "Permission was granted again")
      })
  }

}

export class RevokeOriginCommand implements Command<boolean> {

  constructor(public feature: string) {
  }

  async execute(): Promise<ExecutionResult<boolean>> {
    return usePermissionsStore().revokeAllOrigins()
      .then(() => {
        let msg = "unknown feature " + this.feature
        switch (this.feature) {
          case "thumbnails":
            msg = "Thumbnail permission was removed, subsequently tabs will not have thumbnails"
            usePermissionsStore().deactivateFeature(this.feature)
            break;
          case "all":
            usePermissionsStore().deactivateFeature(FeatureIdent.THUMBNAILS)
            msg = "Permission thumbnail was revoked (if allowed)"
            return new ExecutionResult(true, msg)
          default:
            Promise.reject("feature " + this.feature + " is unknown")
        }
        return new ExecutionResult(true, msg, new UndoCommand(this.feature))

      })
  }

}

RevokeOriginCommand.prototype.toString = function cmdToString() {
  return `RevokeOriginCommand: {feature: ${this.feature}}`;
};
