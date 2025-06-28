import _ from 'lodash'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'

export class SavePdfCommand implements Command<string> {
  constructor(
    public id: string,
    public url: string,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    console.log('executing save pdf command')
    const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({ currentWindow: true })

    const tabcandidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === this.url)
    if (tabcandidates.length > 0) {
      console.log('about to capture pdf')
      return new ExecutionResult('trying to save', 'trying to save')
    } else {
      // console.debug(`did not contain wanted url ${this.url}:\n - ${_.join(_.map(tabs, (t: chrome.tabs.tab) => t.url), ',\n')}`)
      return Promise.reject('no candidate found')
    }
  }
}

SavePdfCommand.prototype.toString = function cmdToString() {
  return `SavePdfCommand: {id=${this.id}, url=${this.url}}`
}
