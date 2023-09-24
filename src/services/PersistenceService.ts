import {Tabset} from "src/models/Tabset";
import {Space} from "src/models/Space";
import {MHtml} from "src/models/MHtml";
import {Tab} from "src/models/Tab";
import {Notification} from "src/models/Notification";
import {SearchDoc} from "src/models/SearchDoc";
import {StaticSuggestionIdent, Suggestion, SuggestionState} from "src/models/Suggestion";
import {MetaLink} from "src/models/MetaLink";
import {RequestInfo} from "src/models/RequestInfo";

interface PersistenceService {

  loadTabsets():Promise<void>
  reloadTabset(tabsetId: string): void
  saveTabset(tabset: Tabset): Promise<any>
  deleteTabset(tabsetId: string):Promise<any>
  cleanUpTabsets(): Promise<void>

  updateThumbnail(url: string):Promise<void>
  saveThumbnail(tab: chrome.tabs.Tab, thumbnail: string):Promise<void>
  getThumbnail(url: string):Promise<string>
  deleteThumbnail(url: string):Promise<void>
  cleanUpThumbnails():Promise<void>

  getContent(url: string):Promise<object>
  updateContent(url: string):Promise<object>
  deleteContent(url: string):Promise<void>
  saveContent(tab: Tab, text: string, metas: object, title: string, tabsetIds: string[]):Promise<any>
  cleanUpContent(): Promise<SearchDoc[]>
  getContents(): Promise<any[]>

  getRequest(url: string): Promise<string>

  getMetaLinks(url: string): Promise<object>
  saveMetaLinks(url: string, metaLinks: MetaLink[]): Promise<void>
  getLinks(url: string): Promise<object>
  saveLinks(url: string, links: any): Promise<void>
  saveMHtml(tab: Tab, mhtml: Blob): Promise<string>
  getMHtml(url: string):Promise<object>
  getMHtmlInline(url: string): Promise<object>
  getMHtmls(): Promise<MHtml[]>

  saveBlob(id: string, url: string, data: Blob, type: string): Promise<any>
  getBlob(blobId: string): Promise<any>

  saveRequest(url: string, requestInfo: RequestInfo): Promise<void>

  loadSpaces(): Promise<any>

  addSpace(space: Space): Promise<any>
  deleteSpace(spaceId: string): void;

  loadCategories(): Promise<any>

  cleanUpRequests(): Promise<void>

  saveStats(date: string, dataset: object): void

  getNotifications(onlyNew: boolean): Promise<Notification[]>
  addNotification(notification: Notification): Promise<any>
  notificationRead(notificationId: string): Promise<void>

  getSuggestions(): Promise<Suggestion[]>
  addSuggestion(suggestion: Suggestion): Promise<any>
  removeSuggestion(ident: StaticSuggestionIdent): any;
  setSuggestionState(id: string, state: SuggestionState): any;

  compactDb(): Promise<any>

  getActiveFeatures(): Promise<string[]>
  saveActiveFeatures(val: string[]): any

  clear(name: string):any
}

export default PersistenceService
