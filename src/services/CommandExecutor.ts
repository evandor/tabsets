import Command from "src/domain/Command";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {ExecutionResult} from "src/domain/ExecutionResult";

const {handleSuccess, handleError} = useNotificationHandler()

export function useCommandExecutor() {

    const executeFromUi = (command: Command<any>): Promise<ExecutionResult<any>> => {
        console.debug("executing command", command)
        return command.execute()
            .then((res) => handleSuccess(res))
            //.then(() => logger.debug("command finished"))
            .catch(err => {
                console.log("error in command", command)
                handleError(err)
                return new ExecutionResult(null, err)
            })
    }

    const execute = (command: Command<any>): Promise<ExecutionResult<any>> => {
        console.debug("executing command", command)
        return command.execute()
            .catch(err => {
                console.log("error in command", command)
                handleError(err)
                return new ExecutionResult(null, err)
            })
    }

    return {
        executeFromUi,
        execute
    }
}
