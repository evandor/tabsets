import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { DynamicTabSource, DynamicTabSourceType } from 'src/tabsets/models/DynamicTabSource'
import { TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class CreateBibblyCollection implements Command<object> {
  public merge: boolean = true

  constructor(
    public tabsetName: string,
    public classification: string,
    public icon: string,
  ) {}

  async execute(): Promise<ExecutionResult<object>> {
    try {
      const tabset = await useTabsetsStore().createTabset(this.tabsetName, [])
      if (tabset) {
        tabset.dynamicTabs = new DynamicTabSource(DynamicTabSourceType.CLASSIFICATION, {
          classification: this.classification,
        })
        tabset.type = TabsetType.BIBBLY
        tabset.icon = this.icon
        await useTabsetService().saveTabset(tabset)
      }

      const executionResult = new ExecutionResult(tabset, 'Bibbly Tabset was created')
      return Promise.resolve(executionResult)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateBibblyCollection.prototype.toString = function cmdToString() {
  return `CreateBibblyCollection: {merge=${this.merge}, tabsetName=${this.tabsetName}}`
}
