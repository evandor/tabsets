import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'

export class DeactivateAiCommand implements Command<boolean> {
  constructor() {}

  async execute(): Promise<ExecutionResult<boolean>> {
    console.log('deactivating AI')
    chrome.storage.local.remove('tabsets.ai.active')
    return Promise.resolve(new ExecutionResult(true, 'done'))
  }
}

DeactivateAiCommand.prototype.toString = function cmdToString() {
  return `DeactivateAiCommand`
}
