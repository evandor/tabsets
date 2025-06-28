import _ from 'lodash'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'

export class SavePngCommand implements Command<string> {
  constructor(
    public id: string,
    public url: string,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    console.log('executing save png command')
    return chrome.tabs
      .query({ currentWindow: true })
      .then((tabs: chrome.tabs.Tab[]) => {
        const tabCandidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === this.url)
        if (tabCandidates.length > 0) {
          console.log('about to capture png')

          return new ExecutionResult('trying to save', 'saving image...')
        } else {
          // console.debug(`did not contain wanted url ${this.url}:\n - ${_.join(_.map(tabs, (t: chrome.tabs.Tab) => t.url), ',\n')}`)
          return Promise.reject('no candidate found')
        }
      })
      .catch((err) => {
        return Promise.reject(err)
      })
  }
}

SavePngCommand.prototype.toString = function cmdToString() {
  return `SavePngCommand: {id=${this.id}, url=${this.url}}`
}
