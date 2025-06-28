import { uid } from 'quasar'
import AppEventDispatcher from 'src/app/AppEventDispatcher'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/core/services/Logger'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useMessagesStore } from 'src/messages/stores/messagesStore'
import { Message } from 'src/tabsets/models/Message'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const { addToTabset, deleteTab } = useTabsetService()
const { sendMsg } = useUtils()
const { info } = useLogger()

class UndoCommand implements Command<any> {
  constructor(
    public tabset: Tabset,
    public tab: Tab,
  ) {}

  execute(): Promise<ExecutionResult<any>> {
    console.log('execution undo command', this.tab, this.tabset)
    return addToTabset(this.tabset, this.tab).then((res) => {
      useTabsetService().saveCurrentTabset()
      return new ExecutionResult(res, 'Tab has been restored again')
    })
  }
}

export class DeleteTabCommand implements Command<Tabset> {
  constructor(
    public tab: Tab,
    public tabset: Tabset,
  ) {}

  async execute(): Promise<ExecutionResult<Tabset>> {
    const tabset: Tabset = await deleteTab(this.tab, this.tabset)
    Analytics.fireEvent('tabset_tab_deleted', { tabsCount: tabset.tabs.length })
    // sharing
    // if (tabset.sharing?.sharedId && tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK) {
    //   tabset.sharing.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
    //   tabset.sharing.sharedAt = new Date().getTime()
    // }
    info('tab deleted')

    if (this.tab.url) {
      const urlStillExists = useTabsetsStore().tabsForUrl(this.tab.url).length > 0
      if (!urlStillExists) {
        // to handle the badge indicator icon
        sendMsg('url-deleted', { url: this.tab.url })
      }
    }

    sendMsg('tab-deleted', { tabsetId: tabset.id, url: this.tab.url })
    const result = await AppEventDispatcher.dispatchEvent('tab-deleted', { url: this.tab.url, tabId: this.tab.id })
    console.log('bookmarksToDelete', result, result['bookmarks' as keyof object] as number)
    if (
      result &&
      (result['bookmarks' as keyof object] as number) > 0 &&
      this.tab.url &&
      useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS)
    ) {
      console.log('bookmarksToDelete', result)
      const bookmarksCount = (result['bookmarks' as keyof object] as number) || 0
      useMessagesStore().addMessage(
        new Message(
          uid(),
          new Date().getTime(),
          new Date().getTime(),
          'new',
          'Delete Bookmark(s) as well?',
          'dialog://deleteTabs/' + btoa(this.tab.url) + '/' + ('' + bookmarksCount),
        ),
      )
    }
    return Promise.resolve(
      new ExecutionResult(
        tabset,
        'Tab was deleted from collection',
        new Map([
          ['Undo', new UndoCommand(tabset, this.tab)],
          // ['Delete Bookmark also', new UndoCommand(tabset, this.tab)],
        ]),
      ),
    )
  }
}

DeleteTabCommand.prototype.toString = function cmdToString() {
  return `DeleteTabCommand: {tab.id=${this.tab.id}, tab.url=${this.tab.url}}`
}
