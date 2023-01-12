import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useLoggingServicee} from "src/services/useLoggingService";
import {usePermissionsStore} from "stores/permissionsStore";
import {GrantOriginCommand} from "src/domain/commands/GrantOriginCommand";
import ChromeApi from "src/services/ChromeApi";

const {TabLogger} = useLoggingServicee()

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
          case "analyseTabs":
            ChromeApi.startWebRequestListener()
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
          case "analyseTabs":
            ChromeApi.stopWebRequestListener()
            usePermissionsStore().deactivateFeature(this.feature)
            msg = "Permission was added, subsequently accessed tabs will not be analysed"
            break;
          case "all":
            usePermissionsStore().deactivateFeature('thumbnails')
            usePermissionsStore().deactivateFeature('analyseTabs')
            msg = "Permissions thumbnails and analyseTabs were revoked (if allowed)"
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
