import {Notify} from 'quasar'
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useLoggingServicee} from "src/services/useLoggingService";

const {logger} = useLoggingServicee()

export function useNotificationHandler() {

  const handleError = (error: any) => {
    logger.info(error) // 'info' only (?) - we did handle this somehow. Warning still shows in extension errors
    Notify.create({
      position: 'bottom',
      color: 'red-5',
      textColor: 'white',
      icon: 'error',
      message: error ? error.toString() : 'unknown error'
    })
  }

  const handleWarning = (res: ExecutionResult<any>) => {
    Notify.create({
      color: 'warning',
      message: res.message
    })
  }

  const handleSuccess = (executionResult: ExecutionResult<any>): ExecutionResult<any> => {
    const actions: any[] = []
    if (executionResult.undoCommand) {
      actions.push(
        {
          label: 'Undo', color: 'white', handler: () => {
            executionResult.undoCommand?.execute()
              .then((res:any) => handleWarning(res))
              .catch((err:any) => handleError(err))
          }
        }
      )
    }
    Notify.create({
      color: 'positive',
      message: executionResult.message,
      actions: actions
    })
    return executionResult
  }

  return {
    handleError, handleSuccess
  }
}
