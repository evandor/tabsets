import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { TabActionMatcher } from 'src/tabsets/actionHandling/TabActionMatcher'

export class ActionHandlerButtonClickedHolder {
  constructor(
    public actionHandler: TabActionMatcher,
    public actionContext?: ActionContext,
    public additionalData: object = {},
  ) {}
}
