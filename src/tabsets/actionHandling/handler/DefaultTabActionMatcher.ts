import { QVueGlobals } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { DefaultActions } from 'src/tabsets/actionHandling/handler/DefaultActions'
import { ComponentWithContext, TabActionMatcher } from 'src/tabsets/actionHandling/TabActionMatcher'
import AddFolderAction from 'src/tabsets/actions/AddFolderAction.vue'
import AddTabAction from 'src/tabsets/actions/AddTabAction.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class DefaultTabActionMatcher implements TabActionMatcher {
  constructor(public $q: QVueGlobals) {}

  tabMatcher(url: string, content: string, metas: object): boolean {
    return true // 'default' matches always, last one in TabActionMatchers
  }

  injectScript(): Promise<void> {
    return Promise.resolve()
  }

  actions(currentTabsetId: string | undefined, actionProps: ActionProps): ComponentWithContext[] {
    const currentTabset = useTabsetsStore().getCurrentTabset
    const actions = DefaultActions.getDefaultActions(currentTabset, actionProps)
    if (useFeaturesStore().hasFeature(FeatureIdent.FOLDER)) {
      actions.unshift({ component: AddFolderAction, context: {} })
    }
    actions.unshift({ component: AddTabAction, context: {} }) // first action
    return actions
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab): void {}
}
