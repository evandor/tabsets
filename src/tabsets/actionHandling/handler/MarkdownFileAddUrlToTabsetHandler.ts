import { QVueGlobals } from 'quasar'
import { DefaultActions } from 'src/tabsets/actionHandling/handler/DefaultActions'
import { ComponentWithContext, TabActionMatcher } from 'src/tabsets/actionHandling/TabActionMatcher'
import AddMarkdownPageAction from 'src/tabsets/actions/AddMarkdownPageAction.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class MarkdownFileAddUrlToTabsetHandler implements TabActionMatcher {
  constructor(public $q: QVueGlobals) {}

  tabMatcher(url: string, content: string, metas: object): boolean {
    return url.match(/.*\.md$/) !== null
  }

  injectScript(): Promise<void> {
    return Promise.resolve()
  }

  // defaultAction(): ActionContext {
  //   return new ActionContext('Add Markdown').withDialog(this.analyseMarkdownDialog, this.$q).onOk(this.onOk)
  // }

  actions(currentTabsetId: string | undefined, actionProps: ActionProps): ComponentWithContext[] {
    const currentTabset = useTabsetsStore().getCurrentTabset
    const actions = DefaultActions.getDefaultActions(currentTabset, actionProps)
    actions.unshift({ component: AddMarkdownPageAction, context: {} })
    return actions
  }

  // async clicked(
  //   chromeTab: chrome.tabs.Tab,
  //   ts: Tabset,
  //   folder?: Tabset,
  //   additionalData: AddUrlToTabsetHandlerAdditionalData = {},
  // ): Promise<ExecutionResult<any>> {
  //   console.log('saving...', chromeTab.id, additionalData)
  //   try {
  //     const useForLinks = additionalData.dialog!['useForLinks' as keyof object] as boolean
  //     const newTab = new Tab(uid(), chromeTab)
  //     await useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, ts, ts.folderActive))
  //     if (useForLinks) {
  //       await useCommandExecutor().execute(new LoadDynamicTabsCommand(ts, newTab.url!))
  //     }
  //     return Promise.resolve(new ExecutionResult('', 'done'))
  //   } catch (error: any) {
  //     console.warn('error', error)
  //     return Promise.reject('error creating markdown tab')
  //   }
  // }
  //
  // updateInTabset(
  //   chromeTab: chrome.tabs.Tab,
  //   ts: Tabset,
  //   folder?: Tabset,
  //   additionalData?: AddUrlToTabsetHandlerAdditionalData,
  // ): Promise<ExecutionResult<any>> {
  //   throw new Error('not implemented K')
  // }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {}

  // async analyseMarkdownDialog($q: QVueGlobals, filename: string = '') {
  //   return Promise.resolve(
  //     $q.dialog({
  //       title: 'Save Markdown File',
  //       message: "The file's content can be analysed and dynamically extracted.",
  //       options: {
  //         type: 'checkbox',
  //         model: [],
  //         items: [{ label: 'Use for links', value: 'useForLinks', color: 'secondary' }],
  //       },
  //       cancel: true,
  //       persistent: true,
  //     }),
  //   )
  // }
}
