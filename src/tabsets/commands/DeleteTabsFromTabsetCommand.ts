import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { TabPredicate } from 'src/core/domain/Types'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'

export class DeleteTabsFromTabsetCommand implements Command<any> {
  constructor(
    public tabsetId: string,
    public updated: number,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    const predicate: TabPredicate = (t: Tab) => t.updated === this.updated && t.bookmarkId !== null
    return useTabsetService()
      .deleteFromTabset(this.tabsetId, predicate)
      .then((res) => {
        Analytics.fireEvent('tabset_tabs_deleted', {})
        return Promise.resolve(new ExecutionResult(res, res + ' Tab(s) were deleted again'))
      })
      .catch((err) => Promise.reject(err))
    // Missing? - delete tabset when empty?
  }
}
