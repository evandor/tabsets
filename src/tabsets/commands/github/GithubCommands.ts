import { LocalStorage } from 'quasar'
import {
  GITHUB_PATH,
  GITHUB_REPONAME,
  GITHUB_TOKEN,
  GITHUB_USERNAME,
  STRIP_CHARS_IN_USER_INPUT,
} from 'src/boot/constants'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'

export abstract class GithubCommands<T> implements Command<T> {
  abstract execute(): Promise<ExecutionResult<T>>

  protected async githubPutContentRequest(filename: string, data: string, sha: string | undefined = undefined) {
    const username = (LocalStorage.getItem(GITHUB_USERNAME) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')
    const reponame = (LocalStorage.getItem(GITHUB_REPONAME) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')
    const path = (LocalStorage.getItem(GITHUB_PATH) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')
    const token = (LocalStorage.getItem(GITHUB_TOKEN) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')

    const githubUrl = `https://api.github.com/repos/${username}/${reponame}/contents/${this.usePath(path)}${filename}`
    console.log('put to ', githubUrl)
    const result = await fetch(githubUrl, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({
        message: 'upload from tabsets extension',
        committer: { name: 'tabsets', email: 'info@tabsets.net' },
        sha: sha,
        // https://stackoverflow.com/questions/23223718/failed-to-execute-btoa-on-window-the-string-to-be-encoded-contains-characte
        content: btoa(unescape(encodeURIComponent(data))),
      }),
    })
    return result
  }

  protected async githubGetContentRequest(filename: string) {
    const username = (LocalStorage.getItem(GITHUB_USERNAME) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')
    const reponame = (LocalStorage.getItem(GITHUB_REPONAME) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')
    const path = (LocalStorage.getItem(GITHUB_PATH) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')
    const token = (LocalStorage.getItem(GITHUB_TOKEN) as string).replace(STRIP_CHARS_IN_USER_INPUT, '')

    return await fetch(
      `https://api.github.com/repos/${username}/${reponame}/contents//${this.usePath(path)}${filename}`,
      {
        method: 'GET',
        headers: this.getHeaders(token),
      },
    )
  }

  private usePath(path: string) {
    return path.trim().length > 0 && !path.endsWith('/') ? path.trim() + '/' : path.trim()
  }

  private getHeaders(token: string) {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    }
  }
}
