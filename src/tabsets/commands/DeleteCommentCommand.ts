import _ from 'lodash'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { TabComment } from 'src/tabsets/models/Tab'
import { TabsetSharing } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class DeleteCommentCommand implements Command<any> {
  constructor(
    public tabId: string,
    public commentId: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tabData = useTabsetsStore().getTabAndTabsetId(this.tabId)
    if (tabData && tabData.tab) {
      console.log('retrieved tabData', tabData)
      const tab = tabData.tab

      tab.comments = _.filter(tab.comments, (c: TabComment) => c.id !== this.commentId)

      const tabset = useTabsetsStore().getTabset(tabData.tabsetId)
      if (tabset && tabset.sharing?.sharedId) {
        tabset.sharing.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
      }
      if (tabset) {
        return useTabsetService()
          .saveTabset(tabset)
          .then(() => {
            Analytics.fireEvent('tabset_comment_deleted', {})
            return new ExecutionResult('done', 'Comment Deleted')
          })
      } else {
        return Promise.reject('could not find tabset')
      }
    } else {
      return Promise.reject('There was a problem deleting your comment')
    }
  }
}

DeleteCommentCommand.prototype.toString = function cmdToString() {
  return `DeleteCommentCommand: {tabId=${this.tabId}, commentId=${this.commentId}`
}
