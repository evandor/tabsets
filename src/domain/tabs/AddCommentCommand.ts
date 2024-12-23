import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { TabComment } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { TabsetSharing } from 'src/tabsets/models/Tabset'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class AddCommentCommand implements Command<any> {
  constructor(
    public tabId: string,
    public comment: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tabData = useTabsetsStore().getTabAndTabsetId(this.tabId)
    if (tabData && tabData.tab) {
      console.log('retrieved tabData', tabData)
      const tab = tabData.tab
      const comment = new TabComment(
        useUiStore().sharingAuthor || '<me>',
        useUiStore().sharingAvatar,
        this.comment,
      )
      if (!tab.comments) {
        tab.comments = []
      }
      console.log('pushing comment', comment)
      tab.comments.push(comment)
      const tabset = useTabsetsStore().getTabset(tabData.tabsetId)
      if (tabset && tabset.sharedId) {
        tabset.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
        //MqttService.publishTabComment(tabset.sharedId, tabData.tab, comment)
      }
      if (tabset) {
        return useTabsetService()
          .saveTabset(tabset)
          .then(() => new ExecutionResult('done', 'Comment Published'))
      } else {
        return Promise.reject('could not find tabset')
      }
    } else {
      return Promise.reject(
        'There was a problem adding your comment - could not find data for tabId ' + this.tabId,
      )
    }
  }
}

AddCommentCommand.prototype.toString = function cmdToString() {
  return `AddCommentCommand: {tabId=${this.tabId}}`
}
