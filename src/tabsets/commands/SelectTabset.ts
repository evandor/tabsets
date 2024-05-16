import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import _ from "lodash"
import {Tab} from "src/tabsets/models/Tab";
import {useUiStore} from "src/stores/uiStore";
import {useUtils} from "src/services/Utils";
import {Tabset} from "src/tabsets/models/Tabset";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {useTabsetService} from "src/services/TabsetService2";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

const {inBexMode, sendMsg} = useUtils()

export class SelectTabsetCommand implements Command<Tabset | undefined> {

  public merge: boolean = true

  constructor(
    public tabsetId: string,
    public spaceId: string | undefined = undefined) {
  }

  // TODO this return the old currentTabset - why? needed?
  async execute(): Promise<ExecutionResult<Tabset | undefined>> {
    console.debug(this.toString())

    const currentTabset = useTabsetsStore().getCurrentTabset
    if (currentTabset) {
      _.forEach(currentTabset.tabs as Tab[], (t: Tab) => t.selected = false)
    }
    //useNotificationsStore().setSelectedTab(null as unknown as Tab)

    useUiStore().clearHighlights()

    useTabsetService().selectTabset(this.tabsetId)
    useSpacesStore().setSpace(this.spaceId)

    if (inBexMode()) {
      const data = {
        ignore: true, // doing this to keep the logic, might be needed again
        data: {tabsetId: this.tabsetId}
      }
      sendMsg('current-tabset-id-change', data);
    }

    const executionResult = new ExecutionResult(currentTabset, "done")
    return Promise.resolve(executionResult)
  }
}

SelectTabsetCommand.prototype.toString = function cmdToString() {
  return `SelectTabsetCommand: {tabsetId=${this.tabsetId}}, {spaceId=${this.spaceId}}`;
};
