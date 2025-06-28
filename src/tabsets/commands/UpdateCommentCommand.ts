import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { TabComment } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'

export class UpdateCommentCommand implements Command<any> {
  constructor(
    public tabId: string,
    public tabComment: TabComment,
    public comment: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tabData = useTabsetsStore().getTabAndTabsetId(this.tabId)
    if (tabData && tabData.tab) {
      console.log('retrieved tabData', tabData)
      const tab = tabData.tab
      const comment = new TabComment(useUiStore().sharingAuthor || '<me>', useUiStore().sharingAvatar, this.comment)

      const originalComment = tab.comments.find((tc: TabComment) => tc.id === this.tabComment.id)
      if (!originalComment) {
        return Promise.reject('could not find original comment')
      }
      originalComment.comment = this.comment
      originalComment.edited = true
      originalComment.date = new Date().getTime()
      console.log('pushing comment', comment)
      const tabset = useTabsetsStore().getTabset(tabData.tabsetId)
      if (tabset) {
        return useTabsetService()
          .saveTabset(tabset)
          .then(() => {
            Analytics.fireEvent('tabset_comment_updated', {})
            return new ExecutionResult('done', 'Comment Published')
          })
      } else {
        return Promise.reject('could not find tabset')
      }
    } else {
      return Promise.reject('There was a problem adding your comment - could not find data for tabId ' + this.tabId)
    }
  }
}

UpdateCommentCommand.prototype.toString = function cmdToString() {
  return `UpdateCommentCommand: {tabId=${this.tabId}, tabComment: ${JSON.stringify(this.tabComment)}}`
}
