import { ref, set } from 'firebase/database'
import sanitizeAsText from 'sanitize-html'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { FirestoreMessage } from 'src/core/models/FirestoreMessage'
import Analytics from 'src/core/utils/google-analytics'
import FirebaseServices from 'src/services/firebase/FirebaseServices'
import { useAuthStore } from 'src/stores/authStore'
import { TabComment } from 'src/tabsets/models/Tab'
import { ChangeInfo, TabsetSharing } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'

export class AddCommentCommand implements Command<any> {
  constructor(
    public tabId: string,
    public comment: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tabData = useTabsetsStore().getTabAndTabsetId(this.tabId)
    if (!tabData || !tabData.tab) {
      return Promise.reject('There was a problem adding your comment - could not find data for tabId ' + this.tabId)
    }
    console.log('retrieved tabData', tabData)
    const tabset = useTabsetsStore().getTabset(tabData.tabsetId)
    if (!tabset) {
      return Promise.reject(`could not find tabset for id '${tabData.tabsetId}'`)
    }
    const sharedById = tabset.sharing.sharedById
    const tab = tabData.tab
    const comment = new TabComment(
      useUiStore().sharingAuthor || useAuthStore().user?.email || '<me>',
      useAuthStore().user?.email || 'undefined',
      sanitizeAsText(this.comment),
    )
    if (!tab.comments) {
      tab.comments = []
    }

    if (sharedById && sharedById !== useAuthStore().user?.uid) {
      const database = FirebaseServices.getDatabase()
      // set(ref(database, 'users/' + useAuthStore().user.uid), comment).catch((err: any) => console.log('got error', err))
      const message = new FirestoreMessage(
        'new-comment',
        comment,
        tabData.tab.id,
        tabData.tabsetId,
        useAuthStore().user.uid,
      )
      set(ref(database, `messages/recipient/${sharedById}`), message).catch((err: any) => console.log('got error', err))
      // set(ref(database, `tabsets/${tabData.tabsetId}/${new Date().getTime()}`), {
      //   event: 'new-comment',
      //   tabId: tabData.tab.id,
      // }).catch((err: any) => console.log('got error', err))
    }

    // console.log('pushing comment', comment)
    tab.comments.push(comment)
    //const tabset = useTabsetsStore().getTabset(tabData.tabsetId)
    if (tabset && tabset.sharing?.sharedId) {
      tabset.sharing.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
    }
    if (tabset) {
      Analytics.fireEvent('tabset_comment_added', {})
      return useTabsetService()
        .saveTabset(tabset, new ChangeInfo('tabcomment', 'added', comment.id, tabset.id))
        .then(() => new ExecutionResult('done', 'Comment Published'))
    } else {
      return Promise.reject('could not find tabset')
    }
  }
}

AddCommentCommand.prototype.toString = function cmdToString() {
  return `AddCommentCommand: {tabId=${this.tabId}}`
}
