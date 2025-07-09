import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'

/**
 */
export class NoOpCommand implements Command<string> {
  constructor() {}

  async execute(): Promise<ExecutionResult<string>> {
    return new ExecutionResult<string>('done', '')
  }
}

NoOpCommand.prototype.toString = function cmdToString() {
  return `NoOpCommand: {}`
}
