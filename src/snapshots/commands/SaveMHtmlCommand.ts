import _ from 'lodash'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'

export class SaveMHtmlCommand implements Command<string> {
  constructor(
    public id: string,
    public url: string,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({ currentWindow: true })
    const tabCandidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === this.url)
    if (tabCandidates.length > 0) {
      const captureDetails = { tabId: tabCandidates[0]!.id || 0 }
      console.log('about to capture', captureDetails)
      if (!chrome.pageCapture) {
        return Promise.reject("permission 'pageCapture' missing!")
      }

      const html: Blob | undefined = await chrome.pageCapture.saveAsMHTML(captureDetails)
      if (html) {
        const mhtmlId = await useSnapshotsStore().saveMHtml(this.id, this.url || '', html)
        return Promise.resolve(new ExecutionResult(mhtmlId, 'done'))
      }
      return Promise.reject('no html found')
    } else {
      return Promise.reject('no candidate found')
    }
  }
}

SaveMHtmlCommand.prototype.toString = function cmdToString() {
  return `SaveMHtmlCommand: {id=${this.id}, url=${this.url}}`
}
