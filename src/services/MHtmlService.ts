import {MHtml} from "src/models/MHtml";
import _ from "lodash"
import {Tab} from "src/models/Tab";
import {useDB} from "src/services/usePersistenceService";

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
}

export default new MHtmlService();