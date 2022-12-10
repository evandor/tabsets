import Command from "src/domain/Command";

export class ExecutionResult {
  constructor(
    result: any,
    public message: string,
    public undoCommand: Command | undefined = undefined) {

  }


}
