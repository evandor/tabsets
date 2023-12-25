import {Notify} from 'quasar'
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useUiStore} from "stores/uiStore";
import {Logz} from "src/services/logz/Logz";

export enum NotificationType {
  NOTIFY = "NOTIFY",
  TOAST = "TOAST"
}

export function useNotificationHandler() {

    const handleError = (error: any, type: NotificationType = NotificationType.TOAST) => {
        console.log("got error: ", error ? error.toString() : 'unknown error')
        console.trace()

      Logz.error({
        message: "handling error in NotificationHandler",
        error: error ? error.toString() : 'unknown error',
        stack: error.stack
      }).catch((logzError: any) => console.warn("could not send error message to logz"))

      switch (type) {
          case NotificationType.NOTIFY:
            Notify.create({
                position: 'bottom',
                color: 'red-5',
                textColor: 'white',
                icon: 'error',
                message: error ? error.toString() : 'unknown error'
            })
            break;
          default:
            useUiStore().createErrorToast(error ? error.toString() : 'unknown error')
        }

    }

    const handleWarning = (res: ExecutionResult<any>) => {
        useUiStore().createWarningToast(res.message)
    }

    const handleSuccess = (executionResult: ExecutionResult<any>, type: NotificationType = NotificationType.TOAST): ExecutionResult<any> => {
        const actions: any[] = []
        if (executionResult.undoCommand) {
            actions.push(
                {
                    label: 'Undo', color: 'white',
                    handler: () => {
                        executionResult.undoCommand?.execute()
                            .then((res: any) => handleWarning(res))
                            .catch((err: any) => handleError(err))
                    }
                }
            )
        }
      switch (type) {
        case NotificationType.NOTIFY:
          Notify.create({
              color: 'positive',
              message: executionResult.message,
              actions: actions
          })
          break;
        default:
          useUiStore().createSuccessToast(executionResult.message, actions[0])
          }
        return executionResult
    }

    return {
        handleError, handleSuccess
    }
}
