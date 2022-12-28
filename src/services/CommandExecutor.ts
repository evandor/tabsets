import Command from "src/domain/Command";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useLoggingServicee} from "src/services/useLoggingService";
import {ExecutionResult} from "src/domain/ExecutionResult";

const {handleSuccess, handleError} = useNotificationHandler()
const {logger} = useLoggingServicee()

export function useCommandExecutor() {

  const executeFromUi = (command: Command): Promise<ExecutionResult> => {
    logger.info("command execution:", command.toString())
    return command.execute()
      .then(res => handleSuccess(res))
      //.then(() => logger.debug("command finished"))
      .catch(err => {
        handleError(err)
        return new ExecutionResult(null, err)
      })
  }

  return {
    executeFromUi
  }
}
