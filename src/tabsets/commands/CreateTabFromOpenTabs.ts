import _ from 'lodash'
import { uid } from 'quasar'
import AppEventDispatcher from 'src/app/AppEventDispatcher'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { DeleteTabCommand } from 'src/tabsets/commands/DeleteTabCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'

const { saveCurrentTabset } = useTabsetService()

class UndoCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public tabset: Tabset,
  ) {}

  execute(): Promise<ExecutionResult<any>> {
    console.info(this.tab, 'execution undo command')
    return new DeleteTabCommand(this.tab, this.tabset)
      .execute()
      .then((res: any) => Promise.resolve(new ExecutionResult(res, 'Tab was deleted again')))
  }
}

export class CreateTabFromOpenTabsCommand implements Command<any> {
  constructor(
    public chromeTab: chrome.tabs.Tab,
    public newIndex: number,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tab = new Tab(uid(), this.chromeTab)
    console.info(tab, 'adding tab')
    //console.log("tabs", tabsStore.getCurrentTabs)
    const exists = _.findIndex(useTabsetsStore().getCurrentTabs, (t: any) => t.url === tab.url) >= 0

    let useIndex = this.newIndex
    console.log('exists', exists)

    const currentTabset: Tabset | undefined = useTabsetsStore().getCurrentTabset

    if (!exists) {
      if (!tab.tags) {
        tab.tags = []
      }

      return TabsetService.saveToCurrentTabset(tab, useIndex)
        .then((res) => {
          if (tab.url) {
            useUiStore().clearHighlights()
            useUiStore().addHighlight(tab.url)
            useTabsetsStore()
              .getCurrentTabsetId()
              .then((currentTsId: string | undefined) => {
                if (currentTsId) {
                  // useSearchStore().update(this.tab.url, 'name', this.newName)
                  AppEventDispatcher.dispatchEvent('add-to-index', {
                    name: '',
                    title: tab.title || '',
                    url: tab.url || '',
                    description: tab.description,
                    content: '',
                    tabsets: [currentTsId],
                    favIconUrl: tab.favIconUrl || '',
                  })
                }
              })
          }
          return res
        })
        .then((res) => {
          if (currentTabset) {
            Analytics.fireEvent('tabset_tab_created_from_opentabs', { tabsCount: currentTabset.tabs.length })
            return TabsetService.getContentFor(tab).then((content) => {
              if (content) {
                return useTabsetService()
                  .saveText(tab, content['content' as keyof object], content['metas' as keyof object])
                  .then((res) => {
                    return new ExecutionResult(
                      'result',
                      'Tab was added',
                      new Map([['Undo', new UndoCommand(tab, currentTabset)]]),
                    )
                  })
              } else {
                return saveCurrentTabset().then(
                  (result) =>
                    new ExecutionResult(
                      result,
                      'Tab was added',
                      new Map([['Undo', new UndoCommand(tab, currentTabset)]]),
                    ),
                )
              }
            })
          } else {
            return Promise.reject('could not determine current tabset')
          }
        })
    } else {
      const oldIndex = _.findIndex(useTabsetsStore().getCurrentTabs, (t: any) => t.id === tab.id)
      if (oldIndex >= 0) {
        const tab = useTabsetsStore().getCurrentTabs.splice(oldIndex, 1)[0]
        useTabsetsStore().getCurrentTabs.splice(useIndex, 0, tab!)
      }
      return saveCurrentTabset().then(
        (result) =>
          new ExecutionResult(
            result,
            'Tab was added',
            new Map([['Undo', new UndoCommand(tab, currentTabset || (null as unknown as Tabset))]]),
          ),
      )
    }
  }
}

CreateTabFromOpenTabsCommand.prototype.toString = function cmdToString() {
  return `CreateTabFromOpenTabs: {tabId=${this.chromeTab.id}}`
}
