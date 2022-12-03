import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {MHtml} from "src/models/MHtml";
import _ from "lodash"
import {Tab} from "src/models/Tab";

class MHtmlService {

  private persistenceService = IndexedDbPersistenceService

  /**
   * Init, called when extension is loaded (via App.vue)
   */
  async init() {
    console.debug("init mhtmlService")
    await this.persistenceService.init();
  }

  saveMHtml(tab: Tab, mhtml: string): Promise<any> {
    return this.persistenceService.saveMHtml(tab, mhtml)
  }

  getMHtmls(): Promise<MHtml[]> {
    const res = this.persistenceService.getMHtmls()
      .then(mhtmls => _.map(mhtmls, mhtml => new MHtml(mhtml.id, mhtml.title, mhtml.favIconUrl)))
    //console.log("res", res)
    return res
  }

  getMHtml(encodedUrl: string) {
    return this.persistenceService.getMHtml(encodedUrl)
  }

  getMHtmlInline(encodedUrl: string) {
    return this.persistenceService.getMHtmlInline(encodedUrl)
  }
}

export default new MHtmlService();
