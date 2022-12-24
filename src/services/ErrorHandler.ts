import {Notify} from 'quasar'
import {ExecutionResult} from "src/domain/ExecutionResult";

export function useNotificationHandler() {

  const handleError = (error: any) => {
    //logger.error("--- catched error ---")
    //logger.error("type", typeof error)
    //logger.error(error)
    Notify.create({
      position: 'bottom',
      color: 'red-5',
      textColor: 'white',
      icon: 'error',
      message: error ? error.toString() : 'unknown error'
    })
  }

  const handleWarning = (res: ExecutionResult) => {
    Notify.create({
      color: 'warning',
      message: res.message
    })
  }

  const handleSuccess = (executionResult: ExecutionResult, logger:any) => {
    const actions: any[] = []
    if (executionResult.undoCommand) {
      actions.push(
        {
          label: 'Undo', color: 'white', handler: () => {
            executionResult.undoCommand?.execute()
              .then(res => handleWarning(res))
              .catch(err => handleError(err))
          }
        }
      )
    }
    Notify.create({
      color: 'positive',
      message: executionResult.message,
      actions: actions
    })
  }

  return {
    handleError, handleSuccess
  }
}
