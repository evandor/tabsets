import Command from 'src/core/domain/Command'
import { ExecutionFailureResult, ExecutionResult } from 'src/core/domain/ExecutionResult'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useLogger } from 'src/core/services/Logger'
import { useUiStore } from 'src/ui/stores/uiStore'

export function useCommandExecutor() {
  const { handleSuccess, handleError } = useNotificationHandler()
  const { info } = useLogger()

  const executeFromUi = async (
    command: Command<any>,
    type: NotificationType = NotificationType.TOAST,
  ): Promise<ExecutionResult<any>> => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    console.log(' *', command.toString())
    info('executing command ' + command.constructor.name)
    useUiStore().commandExecuting = true
    return command
      .execute()
      .then((res: ExecutionResult<any>) => {
        useUiStore().commandExecuting = false
        return res
      })
      .then((res) => handleSuccess(res, type))
      .catch((err) => {
        console.log('error in command', command)
        useUiStore().commandExecuting = false
        handleError(err, type)
        return new ExecutionFailureResult(null, err)
      })
  }

  const execute = async (command: Command<any>): Promise<ExecutionResult<any>> => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    console.log(' * executing command', command.toString())
    return command.execute().catch((err) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      console.log('error in command', command.toString())
      handleError(err)
      return new ExecutionFailureResult(null, err)
    })
  }

  return {
    executeFromUi,
    execute,
  }
}
