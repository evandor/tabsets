import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Space } from 'src/spaces/models/Space'
import { useSpacesService } from 'src/spaces/SpacesService'

export class CreateSpaceCommand implements Command<Space> {
  constructor(public newSpaceName: string) {}

  async execute(): Promise<ExecutionResult<Space>> {
    try {
      const space = await useSpacesService().addSpace(this.newSpaceName)
      return Promise.resolve(
        new ExecutionResult<Space>(space, 'New Space ' + this.newSpaceName + ' created successfully'),
      )
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateSpaceCommand.prototype.toString = function cmdToString() {
  return `CreateSpaceCommand: {name=${this.newSpaceName}}`
}
