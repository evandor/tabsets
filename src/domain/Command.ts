import {ExecutionResult} from "src/domain/ExecutionResult";

export default interface Command {

  execute: (logger: any) => Promise<ExecutionResult> //ICommandResponse

}
