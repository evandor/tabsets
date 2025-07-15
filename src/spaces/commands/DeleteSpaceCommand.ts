import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'

export class DeleteSpaceCommand implements Command<void> {
  constructor(public spaceId: string) {}

  async execute(): Promise<ExecutionResult<void>> {
    try {
      useSpacesStore().deleteById(this.spaceId)
      return Promise.resolve(new ExecutionResult<void>(undefined, 'Space was deleted successfully'))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

DeleteSpaceCommand.prototype.toString = function cmdToString() {
  return `DeleteSpaceCommand: {id=${this.spaceId}}`
}
