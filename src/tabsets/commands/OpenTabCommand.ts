import { openURL } from 'quasar'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { TabActionMatcher } from 'src/tabsets/actionHandling/TabActionMatcher'
import { Tab } from 'src/tabsets/models/Tab'
import { ChangeInfo } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref } from 'vue'

const { inBexMode } = useUtils()

export class OpenTabCommand implements Command<string> {
  getHandler = useActionHandlers(undefined).getHandler

  constructor(public tab: Tab) {}

  async execute() {
    try {
      if (!inBexMode()) {
        openURL(this.tab.url!)
        return Promise.resolve(new ExecutionResult('', 'opened'))
      }

      // special handling
      const protocol = this.tab.url?.split('://')[0]
      switch (protocol) {
        case 'ts-obsidian':
          console.log('protocol', protocol)
          ///www/index.html#/mainpanel/settings
          this.tab.url = chrome.runtime.getURL(
            'www/index.html/#/mainpanel/obsidian/files/' + this.tab.url?.split('://')[1],
          )
          break
        default:
          break
      }

      const handler = ref<TabActionMatcher>(this.getHandler(this.tab.url))
      const browserTab = await useNavigationService().browserTabFor(this.tab.url!, this.tab.id)
      handler.value.handleOpenedTab(browserTab, this.tab)
      //useContentStore().currentTabId = this.tab.id
      await chrome.tabs.highlight({ tabs: browserTab.index })
      if (this.tab.httpInfo && this.tab.httpInfo === 'UPDATED' && this.tab.url) {
        this.tab.httpInfo = ''
        if (useTabsetsStore().getCurrentTabset) {
          await useTabsetsStore().saveTabset(
            useTabsetsStore().getCurrentTabset!,
            new ChangeInfo('tab', 'edited', this.tab.id, this.tab.url),
          )
        }
      }
      if (this.tab.httpStatus === 0) {
        this.tab.httpStatus = 200 // ok "for now"
      }
      Analytics.fireEvent('tabset_tab_opened', {})
      return Promise.resolve(new ExecutionResult('', 'opened'))
    } catch (err: any) {
      return Promise.reject(err)
    }
  }
}

OpenTabCommand.prototype.toString = function cmdToString() {
  return `OpenTabCommand: {tab=${Tab.logIdent(this.tab)}}`
}
