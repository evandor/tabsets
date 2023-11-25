import {useDB} from "src/services/usePersistenceService";
import {Tab} from "src/models/Tab";
import backendApi from "src/services/BackendApi";
import {BlobType, SavedBlob} from "src/models/SavedBlob";
import _ from "lodash"

const {db} = useDB()

class PdfService {

  /**
   * Init, called when extension is loaded (via App.vue)
   */
  async init() {
    console.debug("init mhtmlService")
  }


  convertFrom(html: string) {
    return backendApi.createPdf(html)
  }

  screenshotFrom(html: string) {
    return backendApi.createPng(html)
  }

  saveBlob(tab: Tab, data: Blob, type: string, remark: string | undefined = undefined): Promise<any> {
    return db.saveBlob(tab.id, tab.url || '', data, type, remark)
  }

  getPdfs() {
    return db.getBlobs('PDF')
  }

  getPngs() {
    return db.getBlobs('PNG')
  }

  async getPngsForTab(tabId: string) {
    const blobs = await db.getBlobsForTab(tabId)
    console.log("got blobs", blobs)
    return _.filter(blobs, (b: SavedBlob) => b.type === BlobType.PNG)
  }

}

export default new PdfService();
