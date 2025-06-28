import _ from 'lodash'
import Command from 'src/core/domain/Command'
import { ExecutionFailureResult, ExecutionResult } from 'src/core/domain/ExecutionResult'
import ContentUtils from 'src/core/utils/ContentUtils'
import { useSnapshotsService } from 'src/snapshots/services/SnapshotsService'

export class SaveHtmlCommand implements Command<string> {
  constructor(
    public id: string,
    public url: string,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    console.log('executing save html command')
    return chrome.tabs
      .query({ currentWindow: true })
      .then((tabs: chrome.tabs.Tab[]) => {
        const tabCandidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === this.url)
        if (tabCandidates.length > 0) {
          console.log('about to capture html')

          const chromeTab = tabCandidates[0]

          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          chrome.tabs.sendMessage(chromeTab!.id || 0, 'getExcerpt', {}, async (res) => {
            console.log('getContent returned result with length', res, res?.html.length, chromeTab!.id)
            if (!res || !res.html) {
              return new ExecutionFailureResult('', 'could not retrieve html')
            }
            // if (res.html) {
            //   var doc = (new DOMParser).parseFromString(res.html, "text/html");
            //   var article = new Readability(doc).parse();
            //   console.log("article", article!.content)
            // }

            let html = await ContentUtils.processHtml(tabCandidates[0]!.url || '', res.html)
            //let html = await ContentUtils.processHtml(tabCandidates[0].url || '', article!.content)
            html = res.doctype + '\n' + html
            // console.log("----")
            // console.log(html)
            // console.log("----")
            await useSnapshotsService().saveHTML(this.id, chromeTab!.url || '', html)
            return new ExecutionResult('done', 'Snapshot created')
          })

          return new ExecutionResult('trying to save', 'trying to save')
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

SaveHtmlCommand.prototype.toString = function cmdToString() {
  return `SaveHtmlCommand: {id=${this.id}, url=${this.url}}`
}
