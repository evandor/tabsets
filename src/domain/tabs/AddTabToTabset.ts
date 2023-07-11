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
import {Tabset} from "src/models/Tabset";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {api} from "boot/axios";
import { TAXONOMY } from "src/boot/constants";

const {saveCurrentTabset, saveTabset} = useTabsetService()

// class UndoCommand implements Command<any> {
//
//   constructor(public tab: Tab) {
//   }
//
//   execute(): Promise<ExecutionResult<any>> {
//     console.info(this.tab, "execution undo command")
//     return new DeleteTabCommand(this.tab).execute()
//       .then(res => Promise.resolve(new ExecutionResult(res, "Tab was deleted again")))
//   }
//
// }


export class AddTabToTabsetCommand implements Command<any> {

  constructor(public tab: Tab, public tabset: Tabset) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    const tabsStore = useTabsStore()
    console.info('adding tab to tabset', this.tab.id, this.tabset.id)
    const exists = _.findIndex(this.tabset.tabs, t => t.chromeTab.url === this.tab.chromeTab.url) >= 0
    console.log("exists yields", exists)
    if (!exists) {
      return useTabsetService().addToTabsetId(this.tabset.id, this.tab, 0)
        .then((res) => {
          console.log("res",res.tabs)
          return TabsetService.getContentFor(this.tab)
            .then((content) => {
              console.log("got content", content)
              if (content) {
                return useTabsetService()
                  .saveText(this.tab.chromeTab, content['content' as keyof object], content['metas' as keyof object])
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
              // TODO CreateTabFromOpentabs: Same logic?
              if (usePermissionsStore().hasFeature(FeatureIdent.CATEGORIZATION) && this.tab.chromeTab.url?.startsWith("https://")) {
                console.log("about to check categorization", this.tab.chromeTab.url)
                try {
                  const url = new URL(this.tab.chromeTab.url || '')
                  const origin = url.origin
                  console.log("checking origin", origin)

                  const backendUrl = "https://us-central1-tabsets-backend-prd.cloudfunctions.net/app"
                  api.post(`${backendUrl}/webshrinker/analyze`,
                    {
                      url: origin,
                      taxonomy: TAXONOMY,
                      title: this.tab.chromeTab.title,
                      favIconUrl: this.tab.chromeTab.favIconUrl,
                      description: this.tab.description
                    })
                    .then((res) => {
                      console.log("res", res)
                    })
                    .catch((err) => console.log("got error", err))


                } catch (err) {
                }

              }
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
