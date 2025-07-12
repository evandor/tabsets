import _ from 'lodash'
import AppEventDispatcher from 'src/app/AppEventDispatcher'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useLogger } from 'src/core/services/Logger'
import Analytics from 'src/core/utils/google-analytics'
import { Space } from 'src/spaces/models/Space'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const { info } = useLogger()

function importData(json: string) {
  console.log('importing from json')
  let data = JSON.parse(json)
  let tabsets = data.tabsets || data
  let spaces = data.spaces || []
  let notebooks = data.notebooks || []

  _.forEach(spaces, (space: Space) => {
    useSpacesStore().addSpace(space)
  })

  _.forEach(tabsets, (tabset: Tabset) => {
    useTabsetsStore().addTabset(tabset)
    useTabsetService().saveTabset(tabset)

    _.forEach(tabset.tabs, (tab: Tab) => {
      AppEventDispatcher.dispatchEvent('add-to-search', {
        id: tab.id,
        name: tab.title || '',
        title: tab.title || '',
        url: tab.url || '',
        description: tab.description,
        content: '',
        tabsets: [tabset.id],
        favIconUrl: tab.favIconUrl || '',
      })
    })
  })
}

export class ImportTabsetsCommand implements Command<string> {
  constructor(public json: string) {}

  async execute(): Promise<ExecutionResult<string>> {
    importData(this.json)
    info('imported tabsets')
    Analytics.fireEvent('tabset_imported', {})
    return Promise.resolve(new ExecutionResult('done', 'Tabsets were imported'))
  }
}

ImportTabsetsCommand.prototype.toString = function cmdToString() {
  return `ImportTabsetsCommand`
}
