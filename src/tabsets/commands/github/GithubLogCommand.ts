import { LocalStorage } from 'quasar'
import { GITHUB_LOG, STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { GithubCommands } from 'src/tabsets/commands/github/GithubCommands'

export class GithubLogCommand extends GithubCommands<string> {
  constructor(
    public event: string,
    public entry: object,
  ) {
    super()
  }

  async execute(): Promise<ExecutionResult<string>> {
    const useData = JSON.stringify(this.entry, null, 2)
    //console.log('useData', useData, this.entry)
    if (!LocalStorage.getItem(GITHUB_LOG)) {
      return Promise.resolve(new ExecutionResult('done', 'not active'))
    }
    const today = new Date().toISOString().slice(0, 10)
    const filename = (this.event + '_' + new Date().getTime()).replace(STRIP_CHARS_IN_USER_INPUT, '')
    try {
      const result = await this.githubPutContentRequest('logs/' + today, useData)
      console.log('result', result)
      return Promise.resolve(new ExecutionResult('', 'done'))
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

GithubLogCommand.prototype.toString = function cmdToString() {
  return `GithubLogCommand: {}`
}
