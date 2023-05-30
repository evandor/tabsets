import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {RevokeOriginCommand} from "src/domain/commands/RevokeOriginCommand";

class UndoCommand implements Command<boolean> {

  constructor(public feature: string) {
  }

  execute(): Promise<ExecutionResult<boolean>> {
    console.log("execution undo command")
    return new RevokeOriginCommand(this.feature).execute()
      .then(res => {
        switch (this.feature) {
          case "thumbnails":
            usePermissionsStore().deactivateFeature(this.feature)
            break;
          default:
            Promise.reject("feature " + this.feature + " is unknown")
        }
        return new ExecutionResult(true, "Permission (Origin) was revoked again")
      })
  }

}

export class GrantOriginCommand implements Command<boolean> {

  constructor(public feature: string) {
  }

  async execute(): Promise<ExecutionResult<boolean>> {
    return usePermissionsStore().grantAllOrigins()
      .then((granted: boolean) => {
        if (granted) {
          let msg = "unknown feature " + this.feature
          switch (this.feature) {
            case "thumbnails":
              msg = "Thumbnail permission was added, subsequently stored tabs should have thumbnails"
              usePermissionsStore().activateFeature(this.feature)
              break;
            case "none":
              msg: "All Origins Permission was granted"
            default:
              return Promise.reject("feature " + this.feature + " is unknown")
          }
          return new ExecutionResult(granted, msg, new UndoCommand(this.feature))
        } else {
          if (this.feature) {
            usePermissionsStore().deactivateFeature(this.feature)
          }
          return new ExecutionResult(granted, "Origin was not granted")
        }
      })
  }

}

GrantOriginCommand.prototype.toString = function cmdToString() {
  return `GrantOriginCommand: {feature: ${this.feature}}`;
};
