import Command from "src/domain/Command";
import TabsetService from "src/services/TabsetService";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";
import {useSearchStore} from "src/stores/searchStore";
import {uid} from "quasar";
import {useUiStore} from "src/stores/uiStore";

const {saveCurrentTabset} = useTabsetService()

class UndoCommand implements Command<any> {

  constructor(public tab: Tab) {
  }

  execute(): Promise<ExecutionResult<any>> {
    console.info(this.tab, "execution undo command")
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

  constructor(public tab: Tab, public newIndex: number) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    const tabsStore = useTabsStore()
    console.info(this.tab, 'adding tab by d&d')
    //console.log("tabs", tabsStore.getCurrentTabs)
    const exists = _.findIndex(tabsStore.getCurrentTabs, t => t.chromeTab.url === this.tab.chromeTab.url) >= 0

    let useIndex = this.newIndex
    console.log("exists", exists)

    if (!exists) {
      return TabsetService.saveToCurrentTabset(this.tab, useIndex)
        .then((res) => {
          if (this.tab.chromeTab.url) {
            useUiStore().clearHighlights()
            useUiStore().addHighlight(this.tab.chromeTab.url)
            // useSearchStore().update(this.tab.chromeTab.url, 'name', this.newName)
            useSearchStore().addToIndex(uid(), "", this.tab.chromeTab.title || '',
              this.tab.chromeTab.url, "", "", [tabsStore.currentTabsetId], this.tab.chromeTab.favIconUrl || '')
          }
          return res
        })
        .then((res) => {
          if (tabsStore.pendingTabset) {
            tabsStore.pendingTabset.tabs = _.filter(tabsStore.pendingTabset.tabs, t => t.chromeTab.url !== this.tab.chromeTab.url)
          }
        })
        .then((res) => {
          return TabsetService.getContentFor(this.tab)
            .then((content) => {
              if (content) {
                return useTabsetService()
                  .saveText(this.tab.chromeTab, content['content' as keyof object], content['metas' as keyof object])
                  .then((res) => {
                    return new ExecutionResult("result", "Tab was added", new UndoCommand(this.tab))
                  })
              } else {
                return saveCurrentTabset()
                  .then(result => new ExecutionResult(result, "Tab was added", new UndoCommand(this.tab)))
              }
            })
        })
    } else {
      const oldIndex = _.findIndex(useTabsStore().getCurrentTabs, t => t.id === this.tab.id)
      if (oldIndex >= 0) {
        const tab = tabsStore.getCurrentTabs.splice(oldIndex, 1)[0];
        tabsStore.getCurrentTabs.splice(useIndex, 0, tab);
      }
      return saveCurrentTabset()
        .then(result => new ExecutionResult(
          result,
          "Tab was added",
          new UndoCommand(this.tab)))
    }


  }


}

CreateTabFromOpenTabsCommand.prototype.toString = function cmdToString() {
  return `CreateTabFromOpenTabs: {tab=${this.tab.toString()}}`;
};
