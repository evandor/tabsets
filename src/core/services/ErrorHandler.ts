import { Notify } from 'quasar'
import { useErrorHandlingConfig } from 'src/core/config/errorHandlingConfig'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/core/services/Logger'
import { useUiStore } from 'src/ui/stores/uiStore'

export enum NotificationType {
  NOTIFY = 'NOTIFY',
  TOAST = 'TOAST',
  USER_CHOICE = 'USER_CHOICE',
}

const { error } = useLogger()

export function useNotificationHandler() {
  const handleError = (err: any, type: NotificationType = NotificationType.TOAST) => {
    const errorMsg = err ? err.toString() : 'unknown error'
    const { setupErrorHandling } = useErrorHandlingConfig()
    var scope = setupErrorHandling()

    scope.captureException(new Error(errorMsg))

    error(errorMsg)

    console.warn('showing error message: ', errorMsg)
    console.trace()

    //console.warn(errorMsg /** todo pass actual error */)

    switch (type) {
      case NotificationType.NOTIFY:
        Notify.create({
          position: 'bottom',
          color: 'red-5',
          textColor: 'white',
          icon: 'error',
          message: errorMsg,
        })
        break
      default:
        useUiStore().createErrorToast(errorMsg)
    }
  }

  const handleWarning = (res: ExecutionResult<any>) => {
    useUiStore().createWarningToast(res.message)
  }

  const handleSuccess = (
    executionResult: ExecutionResult<any>,
    type: NotificationType = NotificationType.TOAST,
  ): ExecutionResult<any> => {
    const actions: any[] = []

    for (const key of executionResult.nextCommands.keys()) {
      actions.push({
        label: key,
        color: 'white',
        handler: () => {
          executionResult.nextCommands
            .get(key)!
            .execute()
            .then((res: any) => handleWarning(res))
            .catch((err: any) => handleError(err))
        },
      })
    }

    switch (type) {
      case NotificationType.NOTIFY:
        Notify.create({
          color: 'positive',
          message: executionResult.message,
          actions: actions,
        })
        break
      case NotificationType.USER_CHOICE:
        useUiStore().createUserChoiceToast(executionResult.message, actions)
        break
      default:
        useUiStore().createSuccessToast(executionResult.message, actions)
    }
    return executionResult
  }

  return {
    handleError,
    handleSuccess,
  }
}
