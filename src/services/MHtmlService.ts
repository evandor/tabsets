import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";
import {useDB} from "src/services/usePersistenceService";
import {useTabsStore} from "stores/tabsStore";
import _ from "lodash"
import {useTabsetService} from "src/services/TabsetService2";

const {db} = useDB()

class MHtmlService {

  /**
   * Init, called when extension is loaded (via App.vue)
   */
  async init() {
    console.debug("init mhtmlService")
    //await localDb.init();
  }

  saveMHtml(tab: Tab, mhtml: Blob): Promise<string> {
    console.log("saving MHtml")
    return db.saveMHtml(tab, mhtml)
  }

  getMHtmls(): Promise<MHtml[]> {
    const res = db.getMHtmls()
      .then(mhtmls => _.map(mhtmls, mhtml => new MHtml(mhtml.id, mhtml.title, mhtml.favIconUrl)))
      //console.log("res", res)
    return res
  }

  getMHtml(encodedUrl: string) {
    return db.getMHtml(encodedUrl)
  }

  getMHtmlInline(encodedUrl: string) {
    return db.getMHtmlInline(encodedUrl)
  }

  deleteMHtml(tabId: string, mhtmlId: string) {
    const tab = useTabsStore().getTab(tabId)
    if (tab) {
      tab.mhtmls = _.filter(tab.mhtmls, (e:string) => e !== mhtmlId)
      // assuming tab is in current tabset (TODO)
      useTabsetService().saveCurrentTabset()
    }
    return db.deleteMHtml(mhtmlId)
  }
}

export default new MHtmlService();
