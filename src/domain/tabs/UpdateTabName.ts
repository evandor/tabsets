import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";
import {Tab} from "src/models/Tab";
import LoggingService from "src/services/LoggingService";
import {TabLogger} from "src/logging/TabLogger";
import {useSearchStore} from "src/stores/searchStore";

class UndoCommand implements Command<any> {

  constructor(public tab: Tab, public oldName: string) {
  }

  execute(): Promise<ExecutionResult<any>> {
    TabLogger.info(this.tab, `reverting changed tab name to ${this.oldName}`)
    return TabsetService.setCustomTitle(this.tab, this.oldName)
      .then(res => {
        if (this.tab.chromeTab.url) {
          useSearchStore().update(this.tab.chromeTab.url, 'name', this.oldName)
        }
        return res
      })
      .then(res => new ExecutionResult(res, "Tab's title change was undone"))
  }

}

export class UpdateTabNameCommand implements Command<any> {

  constructor(
    public tab: Tab,
    public newName: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    const oldTitle = this.tab.name ? this.tab.name : this.tab.chromeTab.title || '?'
    TabLogger.info(this.tab, `renaming tab from ${oldTitle} to ${this.newName}`)
    return TabsetService.setCustomTitle(this.tab, this.newName)
      .then(ignored => {
        console.log("custom title", this.tab.chromeTab)
        if (this.tab.chromeTab.url) {
          useSearchStore().update(this.tab.chromeTab.url, 'name', this.newName)
        }
      })
      .then(ignored => Promise.resolve(
        new ExecutionResult(
          this.newName,
          "Tab's title was edited",
          new UndoCommand(this.tab, oldTitle)))
      )
      .catch(err => Promise.reject(err))
  }

}

UpdateTabNameCommand.prototype.toString = function cmdToString() {
  return `UpdateTabNameCommand: {tabId=${this.tab.id}, newName=${this.newName}}`;
};
