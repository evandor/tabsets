import { FeatureIdent } from 'src/app/models/FeatureIdent'
import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { TabFavorite } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

export class ToggleTabFavoriteCommand implements Command<any> {
  public merge: boolean = true

  constructor(public tabId: string) {}

  async execute(): Promise<ExecutionResult<any>> {
    const tabAndTabsetId = useTabsetsStore().getTabAndTabsetId(this.tabId)!
    const tab = tabAndTabsetId.tab
    if (!tab.favorite) {
      tab.favorite = TabFavorite.NONE
    }
    switch (tab.favorite) {
      case TabFavorite.NONE:
        tab.favorite = TabFavorite.TABSET
        break
      case TabFavorite.TABSET:
        if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
          tab.favorite = TabFavorite.SPACE
        } else {
          tab.favorite = TabFavorite.NONE
        }
        break
      case TabFavorite.SPACE:
        tab.favorite = TabFavorite.NONE
    }
    const ts = useTabsetsStore().getTabset(tabAndTabsetId.tabsetId)
    if (ts) {
      await useTabsetsStore().saveTabset(ts)
    }
    return Promise.resolve(new ExecutionResult('', ''))
  }
}

ToggleTabFavoriteCommand.prototype.toString = function cmdToString() {
  return `ToggleTabFavoriteCommand: {tabsetId=${this.tabId}}`
}
