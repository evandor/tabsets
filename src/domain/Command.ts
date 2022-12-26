import {ExecutionResult} from "src/domain/ExecutionResult";

export default interface Command {

  execute: () => Promise<ExecutionResult> //ICommandResponse

}
