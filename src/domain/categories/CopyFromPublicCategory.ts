import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useTabsetService} from "src/services/TabsetService2";
import {Tabset} from "src/models/Tabset";
import _ from "lodash"
import ChromeApi from "src/services/ChromeApi";
import {TAXONOMY} from "boot/constants";

const {saveCurrentTabset} = useTabsetService()


export class CopyFromPublicCategory implements Command<any> {

  constructor(public category: Tabset) {
  }

  async execute(): Promise<ExecutionResult<any>> {
    const ts = _.map(this.category.tabs, t => ChromeApi.createChromeTabObject(
      t.chromeTab.title || '?',
      t.chromeTab.url || '',
      t.chromeTab.favIconUrl || ''
    ))
    const result = await useTabsetService()
      .saveOrReplaceFromChromeTabs(this.category.name, ts, true)
    const replaced = result['replaced' as keyof object]
    const tabset = result['tabset' as keyof object] as Tabset
    tabset.taxonomy = TAXONOMY + "|" + this.category.id
    return useTabsetService().saveTabset(tabset)
      .then((res) => {
        return new ExecutionResult<any>(result, replaced ?
          "Added tabs to existing Tabset " + this.category.id :
          "Created a new Tabset " + this.category.id
        )
      })
      .catch((err) => {
        return Promise.reject("could not complete action")
      })
  }

}

CopyFromPublicCategory.prototype.toString = function cmdToString() {
  return `CopyFromPublicCategory: {category=${this.category.id}}`;
};
