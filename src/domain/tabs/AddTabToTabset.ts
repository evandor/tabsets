import Command from "src/domain/Command";
import TabsetService from "src/services/TabsetService";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {DeleteTabCommand} from "src/domain/tabs/DeleteTabCommand";
import {useSearchStore} from "src/stores/searchStore";
import {uid} from "quasar";
import {useUiStore} from "src/stores/uiStore";
import {Tabset} from "src/models/Tabset";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {api} from "boot/axios";
import { TAXONOMY } from "src/boot/constants";
import {useUtils} from "src/services/Utils";

const {saveCurrentTabset, saveTabset} = useTabsetService()
const {inBexMode,sendMsg} = useUtils()

// No undo command, tab can be deleted manually easily

/**
 * Add provided Tab to provided Tabset.
 */
export class AddTabToTabsetCommand implements Command<any> {

  constructor(public tab: Tab, public tabset: Tabset) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    const tabsStore = useTabsStore()
    console.info(`adding tab '${this.tab.id}' to tabset '${this.tabset.id}'`)
    const exists = _.findIndex(this.tabset.tabs, t => t.url === this.tab.url) >= 0
    console.log("checking 'tab exists' yields", exists)
    if (!exists) {
      return useTabsetService().addToTabsetId(this.tabset.id, this.tab, 0)
        .then((tabset) => {
          // the tab has been added to the tabset, but not saved yet
          return TabsetService.getContentFor(this.tab)
            .then((content) => {
              console.log("got content", content)
              if (content) {
                return useTabsetService()
                  .saveText(this.tab, content['content' as keyof object], content['metas' as keyof object])
                  .then((res) => {
                    return new ExecutionResult("result", "Tab was added",)
                  })
              } else {
                console.log("this tabset tabs",this.tabset.tabs)
                return saveTabset(this.tabset)
                  .then(result => new ExecutionResult(result, "Tab was added"))
                  .catch((err:any) => {
                    console.error("we are here", err)
                    return Promise.reject("problem")
                  })
              }
            })
            .then((res) => {
              sendMsg('tab-added', {tabsetId: tabset.id})
              return res
            })
            .catch((err) => Promise.reject("got err " + err))
        })
    } else {
      return Promise.reject("tab already exists in this tabset")
    }


  }


}

AddTabToTabsetCommand.prototype.toString = function cmdToString() {
  return `AddTabToTabsetCommand: {tab=${this.tab.toString()}}`;
};
