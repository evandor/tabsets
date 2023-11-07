import {Notify} from 'quasar'
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useUiStore} from "stores/uiStore";

export function useNotificationHandler() {

    const handleError = (error: any) => {
        console.log("got error: ", error ? error.toString() : 'unknown error')
        console.trace()
        Notify.create({
            position: 'bottom',
            color: 'red-5',
            textColor: 'white',
            icon: 'error',
            message: error ? error.toString() : 'unknown error'
        })
        useUiStore().createErrorToast(error ? error.toString() : 'unknown error')

    }

    const handleWarning = (res: ExecutionResult<any>) => {
        useUiStore().createWarningToast(res.message)
    }

    const handleSuccess = (executionResult: ExecutionResult<any>): ExecutionResult<any> => {
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
        // Notify.create({
        //     color: 'positive',
        //     message: executionResult.message,
        //     actions: actions
        // })
        useUiStore().createSuccessToast(executionResult.message, actions[0])
        return executionResult
    }

    return {
        handleError, handleSuccess
    }
}
