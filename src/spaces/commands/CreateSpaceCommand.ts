import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useSpacesStore} from "src/spaces/stores/spacesStore";

export class CreateSpaceCommand implements Command<string> {

  constructor(
    public newSpaceName: string
  ) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    try {
      await useSpacesStore().createSpace(this.newSpaceName)
      return Promise.resolve(new ExecutionResult<string>("done", 'New Space ' + this.newSpaceName + ' created successfully'))
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateSpaceCommand.prototype.toString = function cmdToString() {
  return `CreateSpaceCommand: {name=${this.newSpaceName}}`;
};
