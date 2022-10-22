import {Tabset} from "src/models/Tabset";

interface PersistenceService {

  loadTabsets():Promise<void>
  saveTabset(tabset: Tabset): Promise<IDBValidKey>
  deleteTabset(tabsetId: string):Promise<void>

  updateThumbnail(url: string):Promise<void>
  saveThumbnail(url: string, thumbnail: string):Promise<void>
  getThumbnail(url: string):Promise<string>
  deleteThumbnail(url: string):Promise<void>
  cleanUpThumbnails():Promise<void>

  getContent(url: string):Promise<string>
  updateContent(url: string):Promise<void>
  deleteContent(url: string):Promise<void>
  saveContent(tab: chrome.tabs.Tab, text: string, metas: object, title: string, tabsetIds: string[]):Promise<IDBValidKey>
  cleanUpContent(): Promise<void>
  getContents(): Promise<any[]>

}

export default PersistenceService
