import Command from "src/domain/Command";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useUtils} from "src/services/Utils";

const {handleSuccess, handleError} = useNotificationHandler()
const {logger} = useUtils()

export function useCommandExecutor() {

  const executeFromUi = (command: Command): Promise<void> => {
    logger.info("command execution:", command.toString())
    return command.execute()
      .then(res => handleSuccess(res, logger))
      .then(() => logger.debug("command finished"))
      .catch(err => handleError(err))
  }

  return {
    executeFromUi
  }
}
