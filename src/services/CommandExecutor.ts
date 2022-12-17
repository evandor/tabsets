import Command from "src/domain/Command";
import {useNotificationHandler} from "src/services/ErrorHandler";

const {handleSuccess, handleError} = useNotificationHandler()

export function useCommandExecutor(logger: any) {

  const executeFromUi = (command: Command): Promise<void> => {
    logger.info("running command:", command)
    return command.execute(logger)
      .then(res => handleSuccess(res, logger))
      .then(() => logger.debug("command finished"))
      .catch(err => handleError(err, logger))
  }

  return {
    executeFromUi
  }
}
