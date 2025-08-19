import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { DynamicTabSource, DynamicTabSourceType } from 'src/tabsets/models/DynamicTabSource'
import { TabsetType } from 'src/tabsets/models/Tabset'
import { ContentClassification, SystemContentClassification } from 'src/tabsets/models/types/ContentClassification'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class CreateBibblyCollection implements Command<object> {
  iconMap = new Map<SystemContentClassification, string>()

  constructor(public classification: ContentClassification) {
    this.iconMap.set('bibbly:recipe', 'sym_o_skillet')
    this.iconMap.set('bibbly:travel', 'sym_o_travel')
    this.iconMap.set('bibbly:restaurant', 'restaurant')
    this.iconMap.set('bibbly:shopping', 'shopping_cart')
    this.iconMap.set('bibbly:news', 'sym_o_newsmode')
  }

  async execute(): Promise<ExecutionResult<object>> {
    try {
      const tabset = await useTabsetsStore().createTabset(
        this.classification,
        [],
        undefined,
        undefined,
        undefined,
        this.classification,
      )
      if (tabset) {
        tabset.dynamicTabs = new DynamicTabSource(DynamicTabSourceType.CLASSIFICATION, {
          classification: this.classification,
        })
        tabset.type = TabsetType.BIBBLY
        tabset.icon = this.iconMap.get(this.classification as SystemContentClassification) || 'category'
        await useTabsetService().saveTabset(tabset)
      }

      const executionResult = new ExecutionResult(tabset, `new View "${this.classification}" was created`)
      return Promise.resolve(executionResult)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

CreateBibblyCollection.prototype.toString = function cmdToString() {
  return `CreateBibblyCollection: {classification=${this.classification}}`
}
