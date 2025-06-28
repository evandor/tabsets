import { QVueGlobals } from 'quasar'
import { ComponentWithContext, TabActionMatcher } from 'src/tabsets/actionHandling/TabActionMatcher'
import AddPublicTabsetAction from 'src/tabsets/actions/AddPublicTabsetAction.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class PublicTabsetsTabActionMatcher implements TabActionMatcher {
  constructor(public $q: QVueGlobals) {}

  tabMatcher(url: string, content: string, metas: object): boolean {
    return (
      url.match(
        /^https:\/\/raw.githubusercontent.com\/evandor\/public-tabsets\/refs\/heads\/main\/default\/(.*).json$/gm,
      ) != null
    )
  }

  injectScript(): Promise<void> {
    return Promise.resolve()
  }

  actions(currentTabsetId: string | undefined, actionProps: ActionProps): ComponentWithContext[] {
    const currentTabset = useTabsetsStore().getCurrentTabset
    const actions = [] //DefaultActions.getDefaultActions(currentTabset, actionProps)
    actions.unshift({ component: AddPublicTabsetAction, context: {} }) // first action
    return actions
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab): void {}
}
