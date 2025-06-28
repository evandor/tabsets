import Command from 'src/core/domain/Command'

/**
 * the nextCommands parameter can be constructed like this:
 * new Map([["Undo", new UndoCommand(tabId)]]
 */
export class ExecutionResult<T> {
  constructor(
    public result: T,
    public message: string,
    public nextCommands: Map<string, Command<any>> = new Map(),
  ) {}
}

export class ExecutionFailureResult extends ExecutionResult<any> {}
