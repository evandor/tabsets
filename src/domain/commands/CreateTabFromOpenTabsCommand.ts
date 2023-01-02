import Command from "src/domain/Command";
import TabsetService from "src/services/TabsetService";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import {useTabsStore} from "stores/tabsStore";
import {useLoggingServicee} from "src/services/useLoggingService";
import {useTabsetService} from "src/services/TabsetService2";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";

const {TabLogger} = useLoggingServicee()
const {saveCurrentTabset} = useTabsetService()

class UndoCommand implements Command<any> {

  constructor(public tab: Tab) {
  }

  execute(): Promise<ExecutionResult<any>> {
    TabLogger.info(this.tab, "execution undo command")
    return new DeleteTabCommand(this.tab).execute()
      .then(res => Promise.resolve(new ExecutionResult(res, "Tab was deleted again")))
  }

}

function adjustIndex(newIndex: number, tabs: Tab[]) {
  const tabsStore = useTabsStore()
  if (newIndex === 0) { // first element
    //console.log(" 0 - searching for ", tabs[0].id)
    return _.findIndex(tabsStore.getCurrentTabs, t => t.id === tabs[0].id)
  } else {
    //console.log(" 1 - searching for ", tabs[element.newIndex - 1].id)
    return 1 + _.findIndex(tabsStore.getCurrentTabs, t => t.id === tabs[newIndex - 1].id)
  }
}

export class CreateTabFromOpenTabsCommand implements Command<any> {

  constructor(public tab: Tab, public newIndex: number, public group: string) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    const tabsStore = useTabsStore()
    TabLogger.info(this.tab, 'adding tab by d&d, group ' + this.group)
    //console.log("tabs", tabsStore.getCurrentTabs)
    const exists = _.findIndex(tabsStore.getCurrentTabs, t => t.chromeTab.url === this.tab.chromeTab.url) >= 0

    let useIndex = this.newIndex
    switch (this.group) {
      case 'otherTabs':
        // @ts-ignore
        const unpinnedNoGroup: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1)
        if (unpinnedNoGroup.length > 0) {
          useIndex = adjustIndex(this.newIndex, unpinnedNoGroup);
        }
        // @ts-ignore
        this.tab.chromeTab.groupId = -1
        this.tab.chromeTab.pinned = false
        break;
      case 'pinnedTabs':
        const filteredTabs: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => t.chromeTab.pinned)
        if (filteredTabs.length > 0) {
          useIndex = adjustIndex(this.newIndex, filteredTabs);
        }
        this.tab.chromeTab.pinned = true
        // @ts-ignore
        this.tab.chromeTab.groupId = -1
        break
      default:
        if (this.group.startsWith('groupedTabs_')) {
          const groupId = this.group.split('_')[1]
          //console.log("got group id", groupId)
          // @ts-ignore
          const filteredTabs: Tab[] = _.filter(tabsStore.getCurrentTabs, (t: Tab) => t.chromeTab.groupId === parseInt(groupId))
          if (filteredTabs.length > 0) {
            useIndex = adjustIndex(this.newIndex, filteredTabs);
          }
          // @ts-ignore
          this.tab.chromeTab.groupId = parseInt(groupId)
        }
        break
    }

    if (!exists) {
      TabsetService.saveToCurrentTabset(this.tab, useIndex)
    } else {
      const oldIndex = _.findIndex(useTabsStore().getCurrentTabs, t => t.id === this.tab.id)
      if (oldIndex >= 0) {
        const tab = tabsStore.getCurrentTabs.splice(oldIndex, 1)[0];
        tabsStore.getCurrentTabs.splice(useIndex, 0, tab);
      }
    }

    return saveCurrentTabset()
      .then(result => new ExecutionResult(
        result,
        "Tab was added",
        new UndoCommand(this.tab)))
  }


}

CreateTabFromOpenTabsCommand.prototype.toString = function cmdToString() {
  return `CreateTabFromOpenTabs: {tab=${this.tab.toString()}}`;
};
