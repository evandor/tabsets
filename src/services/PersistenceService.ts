import {Tabset} from "src/models/Tabset";
import {Space} from "src/models/Space";
import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";

interface PersistenceService {

  loadTabsets():Promise<void>
  saveTabset(tabset: Tabset): Promise<IDBValidKey>
  deleteTabset(tabsetId: string):Promise<void>

  updateThumbnail(url: string):Promise<void>
  saveThumbnail(url: string, thumbnail: string):Promise<void>
  getThumbnail(url: string):Promise<string>
  deleteThumbnail(url: string):Promise<void>
  cleanUpThumbnails():Promise<void>

  getContent(url: string):Promise<object>
  updateContent(url: string):Promise<object>
  deleteContent(url: string):Promise<void>
  saveContent(tab: chrome.tabs.Tab, text: string, metas: object, title: string, description: string, tabsetIds: string[]):Promise<IDBValidKey>
  cleanUpContent(): Promise<void>
  getContents(): Promise<any[]>

  saveMHtml(tab: Tab, mhtml: string): Promise<IDBValidKey>
  getMHtml(url: string):Promise<object>
  getMHtmlInline(url: string): Promise<object>
  getMHtmls(): Promise<MHtml[]>

  addSpace(space: Space): Promise<void>
}

export default PersistenceService
