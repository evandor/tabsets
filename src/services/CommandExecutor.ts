import Command from "src/domain/Command";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {ExecutionResult} from "src/domain/ExecutionResult";
import LoggingService from "src/services/LoggingService";

const {handleSuccess, handleError} = useNotificationHandler()

export function useCommandExecutor() {

  const executeFromUi = (command: Command<any>): Promise<ExecutionResult<any>> => {
    LoggingService.logger.info("command execution:", command.toString())
    return command.execute()
      .then((res) => handleSuccess(res))
      //.then(() => logger.debug("command finished"))
      .catch(err => {
        handleError(err)
        return new ExecutionResult(null, err)
      })
  }

  const execute = (command: Command<any>): Promise<ExecutionResult<any>> => {
    LoggingService.logger.info("command execution:", command.toString())
    return command.execute()
      .catch(err => {
        handleError(err)
        return new ExecutionResult(null, err)
      })
  }

  return {
    executeFromUi,
    execute
  }
}
