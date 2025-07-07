import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { DynamicTabSource, DynamicTabSourceType } from 'src/tabsets/models/DynamicTabSource'
import { TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class CreateDynamicTabset implements Command<object> {
  public merge: boolean = true

  constructor(
    public tabsetName: string,
    public sourceType: DynamicTabSourceType,
  ) {}

  async execute(): Promise<ExecutionResult<object>> {
    try {
      const tabset = await useTabsetsStore().createTabset('Tag: ' + this.tabsetName, [])
      if (tabset) {
        if (this.sourceType === DynamicTabSourceType.TAG) {
          tabset.dynamicTabs = new DynamicTabSource(this.sourceType, { tags: [this.tabsetName] })
        } else {
          tabset.dynamicTabs = new DynamicTabSource(this.sourceType)
        }
        tabset.type = TabsetType.DYNAMIC
        console.log('tabset', tabset)
        await useTabsetService().saveTabset(tabset)
      }

      const executionResult = new ExecutionResult(tabset, 'Dynamic Tabset was created')
      return Promise.resolve(executionResult)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateDynamicTabset.prototype.toString = function cmdToString() {
  return `CreateDynamicTabsetCommand: {merge=${this.merge}, tabsetName=${this.tabsetName}}`
}
