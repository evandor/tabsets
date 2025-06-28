import { LocalStorage, uid } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { GITHUB_PATH, GITHUB_REPONAME, GITHUB_USERNAME, STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { GithubCommands } from 'src/tabsets/commands/github/GithubCommands'
import { OpenTabCommand } from 'src/tabsets/commands/OpenTabCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

export class GithubBackupCommand extends GithubCommands<string> {
  constructor(public filenames: string[] = ['tabsets_backup_current']) {
    super()
  }

  async execute(): Promise<ExecutionResult<string>> {
    const data = useTabsetService().exportDataAsJson()
    let existing = ''
    try {
      for (let i = 0; i < this.filenames.length; i++) {
        const existingResponse = await this.githubGetContentRequest(this.filenames[0]!)
        let sha: string | undefined = undefined
        if (existingResponse.ok) {
          existing = await existingResponse.json()
          sha = existing['sha' as keyof object]
        }
        const r = await this.githubPutContentRequest(this.filenames[i]!, data, sha)
        console.log('got', r)
      }
      const username = (LocalStorage.getItem(GITHUB_USERNAME) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')
      const reponame = (LocalStorage.getItem(GITHUB_REPONAME) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')
      const path = (LocalStorage.getItem(GITHUB_PATH) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')
      return Promise.resolve(
        new ExecutionResult(
          '',
          'done',
          new Map([
            [
              'Check Repository',
              new OpenTabCommand(
                new Tab(
                  uid(),
                  BrowserApi.createChromeTabObject(
                    'Repository',
                    `https://github.com/${username}/${reponame}/tree/main/${path}`,
                  ),
                ),
              ),
            ],
          ]),
        ),
      )
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

GithubBackupCommand.prototype.toString = function cmdToString() {
  return `GithubBackupCommand: {}`
}
