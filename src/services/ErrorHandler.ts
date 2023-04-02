import {Notify} from 'quasar'
import {ExecutionResult} from "src/domain/ExecutionResult";

export function useNotificationHandler() {

  const handleError = (error: any) => {
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
              .then((res: any) => handleWarning(res))
              .catch((err: any) => handleError(err))
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
