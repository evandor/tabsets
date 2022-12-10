//import {useQuasar} from "quasar";
import {Notify} from 'quasar'
import {ExecutionResult} from "src/domain/ExecutionResult";

export function useNotificationHandler() {

  const handleError = (error: any) => {
    console.log("--- catched error ---")
    console.log("type", typeof error)
    console.log("msg", error)
    Notify.create({
      position: 'bottom',
      color: 'red-5',
      textColor: 'white',
      icon: 'error',
      message: error.toString()
    })
  }

  const handleWarning = (res: ExecutionResult) => {
    Notify.create({
      color: 'warning',
      message: res.message
    })
  }

  const handleSuccess = (executionResult: ExecutionResult) => {
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
