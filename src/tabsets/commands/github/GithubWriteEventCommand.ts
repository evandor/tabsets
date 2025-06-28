import { LocalStorage } from 'quasar'
import { GITHUB_AUTO_SYNC, GITHUB_AUTO_SYNC_READONLY } from 'src/boot/constants'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { GithubCommands } from 'src/tabsets/commands/github/GithubCommands'

export type TabsetEventClass = 'tab' | 'tabset' | 'space' | 'note'
export type TabsetEventType = 'added' | 'deleted'

export class TabsetEvent {
  timestamp: number
  clazz: TabsetEventClass

  constructor(
    public event: TabsetEventType,
    public tabsetId: string,
    public parentId: string | undefined,
    public name: string,
    public spaces: string[],
  ) {
    this.timestamp = new Date().getTime()
    this.name = this.name.trim()
    this.clazz = 'tabset'
  }

  format() {
    let line = `${this.timestamp}|`
    line += `${this.clazz}|${this.event}|`
    line += `${this.tabsetId}|${this.parentId ? this.parentId : ''}|`
    line += this.name.replaceAll('|', '').replace(/\s/g, ' ').trim() + '|'
    line += this.spaces.join(',')
    line += '\n'
    //return `${this.timestamp}|${this.clazz}|${this.event}|${this.tabsetId}|${this.activeFolderId ? this.activeFolderId : ''}|${this.name.replaceAll('|', '').replace(/\s/g, ' ').trim()}\n`
    return line
  }
}

export class TabEvent {
  timestamp: number
  clazz: TabsetEventClass

  constructor(
    public event: TabsetEventType,
    public tabsetId: string,
    public tabId: string | undefined,
    public name: string,
    public url: string | undefined,
    public favIconUrl: string | undefined,
  ) {
    this.timestamp = new Date().getTime()
    this.name = this.name.trim()
    this.clazz = 'tab'
  }

  format() {
    return `${this.timestamp}|${this.clazz}|${this.event}|${this.tabsetId}|${this.tabId}|${this.name.replaceAll('|', '').replace(/\s/g, ' ').trim()}|${this.url}|${this.favIconUrl}\n`
  }
}

export class SpaceEvent {
  timestamp: number
  clazz: TabsetEventClass

  constructor(
    public event: TabsetEventType,
    public spaceId: string,
    public tabsetId: string | undefined,
    public name: string,
  ) {
    this.timestamp = new Date().getTime()
    this.name = this.name.trim()
    this.clazz = 'space'
  }

  format() {
    return `${this.timestamp}|${this.clazz}|${this.event}|${this.spaceId}|${this.tabsetId ? this.tabsetId : ''}|${this.name.replaceAll('|', '').replace(/\s/g, ' ').trim()}\n`
  }
}

// export class NoteEvent {
//   timestamp: number
//   clazz: TabsetEventClass
//
//   constructor(
//     public event: TabsetEventType,
//     public tabsetId: string,
//     public name: string,
//     public content: NotesPage,
//   ) {
//     this.timestamp = new Date().getTime()
//     this.name = this.name.trim()
//     this.clazz = 'note'
//   }
//   format() {
//     const encoded = btoa(JSON.stringify(this.content))
//     console.log('content', this.content, encoded)
//     return `${this.timestamp}|${this.clazz}|${this.event}|${this.tabsetId}|${this.name.replaceAll('|', '').replace(/\s/g, ' ').trim()}|${encoded}\n`
//   }
// }

export class GithubWriteEventCommand extends GithubCommands<string> {
  constructor(public event: TabsetEvent | TabEvent) {
    super()
  }

  async execute(): Promise<ExecutionResult<string>> {
    const githubPath = 'events'
    const useData = this.event.format()
    if (!LocalStorage.getItem(GITHUB_AUTO_SYNC) || LocalStorage.getItem(GITHUB_AUTO_SYNC_READONLY)) {
      return Promise.resolve(new ExecutionResult('done', 'not active'))
    }
    console.log('useData', useData, this.event)
    try {
      const events = await this.githubGetContentRequest(githubPath)
      console.log('events', events.status)
      if (events.status == 404) {
        await this.githubPutContentRequest(githubPath, useData)
      } else if (events.ok) {
        const existing = await events.json()
        console.log('got existing', existing)
        const decodedContent = decodeURIComponent(escape(window.atob(existing.content)))
        const sha = existing['sha' as keyof object]
        await this.githubPutContentRequest(githubPath, decodedContent + useData, sha)
      }

      // const result = await this.githubPutContentRequest('logs/' + today, useData)
      // console.log('result', result)
      return Promise.resolve(new ExecutionResult('', 'done'))
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

GithubWriteEventCommand.prototype.toString = function cmdToString() {
  return `GithubWriteEventCommand: {event: ${this.event.format()}`
}
