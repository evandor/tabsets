import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { GithubCommands } from 'src/tabsets/commands/github/GithubCommands'

export class GithubGetLatestBackupCommand extends GithubCommands<string> {
  constructor(public filenames: string[] = ['tabsets_backup_current']) {
    super()
  }

  async execute(): Promise<ExecutionResult<string>> {
    const existingResponse = await this.githubGetContentRequest('tabsets_backup_current')
    if (existingResponse.ok) {
      const existing = await existingResponse.json()
      const decodedContent = decodeURIComponent(escape(window.atob(existing.content)))
      return Promise.resolve(new ExecutionResult(decodedContent, 'done'))
    }
    return Promise.reject('not found')
  }
}

GithubGetLatestBackupCommand.prototype.toString = function cmdToString() {
  return `GithubGetLatestBackupCommand: {}`
}
