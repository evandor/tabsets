import { DialogChainObject, QVueGlobals } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { DefaultActions } from 'src/tabsets/actionHandling/handler/DefaultActions'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import {
  AddUrlToTabsetHandlerAdditionalData,
  ClickedHandler,
  ComponentWithContext,
  TabActionMatcher,
} from 'src/tabsets/actionHandling/TabActionMatcher'
import AddFolderAction from 'src/tabsets/actions/AddFolderAction.vue'
import AddTabAction from 'src/tabsets/actions/AddTabAction.vue'
import ImportChromeBookmarksAction from 'src/tabsets/actions/bookmarks/ImportChromeBookmarksAction.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { CreateTabsetFromBookmarksRecursive } from 'src/tabsets/commands/CreateTabsetFromBookmarksRecursive'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

function getBmFolderId(chromeTab: chrome.tabs.Tab) {
  return chromeTab.url?.split('?')[1]?.split('=')[1] || undefined
}

export class ImportFromChromeBookmarksManagerAddUrlToTabsetHandler implements TabActionMatcher {
  constructor(public $q: QVueGlobals) {}

  tabMatcher(url: string, content: string, metas: object): boolean {
    return url.match(/^chrome:\/\/bookmarks.*$/) !== null
  }

  injectScript(): Promise<void> {
    return Promise.resolve()
  }

  actions(currentTabsetId: string | undefined, actionProps: ActionProps): ComponentWithContext[] {
    // const folderId = getBmFolderId(t)
    //console.log('actions', actionProps)
    const currentTabset = useTabsetsStore().getCurrentTabset
    const actions = DefaultActions.getDefaultActions(currentTabset, actionProps)

    if (useFeaturesStore().hasFeature(FeatureIdent.FOLDER)) {
      actions.unshift({ component: AddFolderAction, context: {} })
    }
    actions.unshift({ component: AddTabAction, context: {} })
    actions.push({
      component: ImportChromeBookmarksAction,
      context: {},
    })
    // return [
    //   ,
    // // {
    // //   label: 'Import...',
    // //   identifier: ButtonActions.ImportChromeBookmarks,
    // //   active: (t: chrome.tabs.Tab) => {
    // //     const folderId = getBmFolderId(t)
    // //     return !folderId ? false : (useTabsetsStore().getCurrentTabset?.bookmarkId || '') !== folderId
    // //   },
    // // },
    // new ActionContext('Import...', undefined, undefined, {}, (t: chrome.tabs.Tab) => {
    //   const folderId = getBmFolderId(t)
    //   return !folderId ? false : (useTabsetsStore().getCurrentTabset?.bookmarkId || '') !== folderId
    // })
    //   .withDialog(this.importChromeBookmarksDialog, this.$q)
    //   .onOk(this.onOk),
    // // {
    // //   label: 'Add Tab',
    // //   identifier: ButtonActions.AddTab,
    // //   active: (t: chrome.tabs.Tab) => !useTabsetService().urlExistsInCurrentTabset(t.url),
    // // },
    // new ActionContext(
    //   'Add Tab',
    //   undefined,
    //   undefined,
    //   {},
    //   (t: chrome.tabs.Tab) => !useTabsetService().urlExistsInCurrentTabset(t.url),
    // ).onClicked(this.clicked),
    //]
    return actions
  }

  async clicked(
    chromeTab: chrome.tabs.Tab,
    ts: Tabset,
    folder?: Tabset,
    additionalData: AddUrlToTabsetHandlerAdditionalData = {
      action: new ActionContext('default'),
    },
  ): Promise<ExecutionResult<any>> {
    console.log('clicked...', chromeTab, additionalData)
    const bmFolderId = getBmFolderId(chromeTab)
    if (!bmFolderId) {
      return Promise.reject('could not parse bookmarks id from URL')
    }
    try {
      const currentTabsetName = useTabsetsStore().getCurrentTabset?.name || 'unknown'
      const res: ExecutionResult<Tabset> = await useCommandExecutor().execute(
        new CreateTabsetFromBookmarksRecursive(currentTabsetName, bmFolderId, true),
      )
      const tabset = res.result
      await useTabsetService().saveTabset(tabset)
      console.log('imported to tabset', tabset.id)
      await useTabsetsStore().reloadTabset(tabset.id)
      return Promise.resolve(new ExecutionResult('', ''))
      //  })
    } catch (e: any) {
      console.log('got error', e)
      return Promise.reject('error importing bookmarks')
    }
  }

  updateInTabset(chromeTab: chrome.tabs.Tab, ts: Tabset, additionalData: object = {}): Promise<ExecutionResult<any>> {
    throw new Error('not implemented K')
  }

  handleOpenedTab(browserTab: chrome.tabs.Tab, tab: Tab) {}

  async importChromeBookmarksDialog($q: QVueGlobals): Promise<DialogChainObject> {
    return $q.dialog({
      title: 'Import Bookmarks',
      message: 'Click "OK" to import the  selected bookmarks folder to the current tabset',
      options: {
        type: 'checkbox',
        model: [],
        items: [{ label: 'Recursive', value: 'recursive', color: 'secondary' }],
      },
      cancel: true,
      persistent: true,
    })
  }

  onOk = (data: string[]): ClickedHandler => {
    console.log('data!', data)
    return this.clicked
  }
}
